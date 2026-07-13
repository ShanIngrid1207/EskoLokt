#![cfg(test)]

use crate::{CodLock, CodLockClient, Status};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

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

/// A deadline `secs` in the future relative to the current ledger time.
fn future(env: &Env, secs: u64) -> u64 {
    env.ledger().timestamp() + secs
}

// Test 1 (Happy path): fund -> confirm -> the DEPOSIT RETURNS TO THE BUYER.
#[test]
fn test_confirm_delivery_returns_deposit_to_buyer() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);
    let token = token::Client::new(&s.env, &s.token_addr);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &100, &future(&s.env, 60));

    // Buyer debited the deposit, escrow holds it.
    assert_eq!(token.balance(&s.buyer), 900);
    assert_eq!(token.balance(&s.contract_id), 100);

    client.confirm_delivery(&id);

    // Deposit returned to the buyer, escrow drained. Seller gets nothing.
    assert_eq!(token.balance(&s.buyer), 1_000);
    assert_eq!(token.balance(&s.seller), 0);
    assert_eq!(token.balance(&s.contract_id), 0);
    assert_eq!(client.get_order(&id).status, Status::Returned);
}

// Test 2 (No-show): after the deadline the SELLER claims the deposit.
#[test]
fn test_claim_expired_pays_seller_after_deadline() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);
    let token = token::Client::new(&s.env, &s.token_addr);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &100, &future(&s.env, 60));

    // Move ledger time past the deadline.
    s.env.ledger().set_timestamp(future(&s.env, 120));

    client.claim_expired(&id);

    assert_eq!(token.balance(&s.seller), 100); // deposit to seller
    assert_eq!(token.balance(&s.contract_id), 0);
    assert_eq!(client.get_order(&id).status, Status::Claimed);
}

// Test 3 (Time guard): the seller cannot claim before the deadline.
#[test]
fn test_claim_expired_before_deadline_fails() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &100, &future(&s.env, 600));

    // Still before the deadline -> must fail.
    let result = client.try_claim_expired(&id);
    assert!(result.is_err());
}

// Test 4 (Double-resolve guard): a resolved order cannot pay out again.
#[test]
fn test_cannot_resolve_twice() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &100, &future(&s.env, 60));
    client.confirm_delivery(&id);

    // Second confirmation must fail: status is no longer Funded.
    assert!(client.try_confirm_delivery(&id).is_err());
    // And a late claim on an already-returned order must also fail.
    s.env.ledger().set_timestamp(future(&s.env, 120));
    assert!(client.try_claim_expired(&id).is_err());
}

// Test 5 (State verification): storage reflects the order fields + transitions.
#[test]
fn test_order_fields_and_state() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);
    let deadline = future(&s.env, 300);

    let id = client.create_order(&s.buyer, &s.seller, &s.token_addr, &100, &deadline);

    let order = client.get_order(&id);
    assert_eq!(order.buyer, s.buyer);
    assert_eq!(order.seller, s.seller);
    assert_eq!(order.amount, 100);
    assert_eq!(order.deadline, deadline);
    assert_eq!(order.status, Status::Funded);

    client.confirm_delivery(&id);
    assert_eq!(client.get_order(&id).status, Status::Returned);
}

// Test 6 (Isolation): two orders get independent ids and settle independently.
#[test]
fn test_orders_are_independent() {
    let s = setup();
    let client = CodLockClient::new(&s.env, &s.contract_id);
    let token = token::Client::new(&s.env, &s.token_addr);

    let id1 = client.create_order(&s.buyer, &s.seller, &s.token_addr, &300, &future(&s.env, 60));
    let id2 = client.create_order(&s.buyer, &s.seller, &s.token_addr, &200, &future(&s.env, 60));
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);

    // Order 1: delivered (deposit back to buyer). Order 2: no-show (deposit to seller).
    client.confirm_delivery(&id1);
    s.env.ledger().set_timestamp(future(&s.env, 120));
    client.claim_expired(&id2);

    assert_eq!(client.get_order(&id1).status, Status::Returned);
    assert_eq!(client.get_order(&id2).status, Status::Claimed);
    assert_eq!(token.balance(&s.seller), 200); // got order 2's deposit
    assert_eq!(token.balance(&s.buyer), 800); // 1000 - 200 (order 2 still escrowed→seller); order 1 returned
    assert_eq!(token.balance(&s.contract_id), 0);
}
