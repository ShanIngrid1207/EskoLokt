#![cfg(test)]

use crate::{CodLock, CodLockClient, Status};
use soroban_sdk::{testutils::Address as _, token, Address, Env};

/// Owned test fixture. Holds the env so borrows (client, token) stay valid
/// for the lifetime of each test.
struct Setup {
    env: Env,
    contract_id: Address,
    buyer: Address,
    seller: Address,
    token_addr: Address,
}

/// Spin up a fresh env, deploy the contract, create a USDC-like token, and
/// mint 1_000 units to the buyer. Auth is mocked so require_auth() passes.
fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CodLock, ());

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // A Stellar Asset Contract stands in for USDC on testnet.
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    token::StellarAssetClient::new(&env, &token_addr).mint(&buyer, &1_000);

    Setup {
        env,
        contract_id,
        buyer,
        seller,
        token_addr,
    }
}

// Test 1 (Happy path): fund -> confirm -> seller is paid, escrow is empty.
#[test]
fn test_confirm_delivery_pays_seller() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);
    let token = token::Client::new(&s.env, &s.token_addr);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &500);

    // Buyer debited, escrow holds the funds.
    assert_eq!(token.balance(&s.buyer), 500);
    assert_eq!(token.balance(&s.contract_id), 500);

    client.confirm_delivery(&id);

    // Seller paid, escrow drained.
    assert_eq!(token.balance(&s.seller), 500);
    assert_eq!(token.balance(&s.contract_id), 0);
    assert_eq!(client.get_order(&id).status, Status::Released);
}

// Test 2 (Edge case): an already-finalized order cannot be released again.
#[test]
fn test_cannot_confirm_twice() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &500);
    client.confirm_delivery(&id);

    // Second confirmation must fail: status is no longer Funded.
    let result = client.try_confirm_delivery(&id);
    assert!(result.is_err());
}

// Test 3 (State verification): storage reflects each lifecycle transition.
#[test]
fn test_order_state_transitions() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &500);

    let order = client.get_order(&id);
    assert_eq!(order.buyer, s.buyer);
    assert_eq!(order.seller, s.seller);
    assert_eq!(order.amount, 500);
    assert_eq!(order.status, Status::Funded);

    client.confirm_delivery(&id);
    assert_eq!(client.get_order(&id).status, Status::Released);
}

// Test 4 (Refund flow): fund -> refund -> buyer made whole.
#[test]
fn test_refund_returns_funds_to_buyer() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);
    let token = token::Client::new(&s.env, &s.token_addr);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &500);
    assert_eq!(token.balance(&s.buyer), 500);

    client.refund_order(&id);

    assert_eq!(token.balance(&s.buyer), 1_000); // full balance restored
    assert_eq!(token.balance(&s.contract_id), 0);
    assert_eq!(client.get_order(&id).status, Status::Refunded);
}

// Test 5 (Isolation): two orders get independent ids and settle independently.
#[test]
fn test_orders_are_independent() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);
    let token = token::Client::new(&s.env, &s.token_addr);

    let id1 = client.create_order(&s.buyer, &s.seller, &s.token_addr, &300);
    let id2 = client.create_order(&s.buyer, &s.seller, &s.token_addr, &200);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);

    // Confirm one, refund the other — they don't interfere.
    client.confirm_delivery(&id1);
    client.refund_order(&id2);

    assert_eq!(client.get_order(&id1).status, Status::Released);
    assert_eq!(client.get_order(&id2).status, Status::Refunded);
    assert_eq!(token.balance(&s.seller), 300); // got order 1
    assert_eq!(token.balance(&s.buyer), 700); // 1000 - 300 confirmed, 200 refunded back
}
