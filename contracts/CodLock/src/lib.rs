#![no_std]
//! EskoLokt — trustless **refundable-deposit** escrow for Filipino social-commerce COD.
//!
//! The buyer still pays cash at the door like normal COD; they only lock a small
//! refundable deposit on-chain. That deposit can only move in one of two ways:
//!   1. Buyer funds an order   -> deposit moves into this contract.      Status = Funded.
//!   2. Delivery confirmed      -> deposit returns to the BUYER.          Status = Returned.
//!   3. No-show past `deadline` -> SELLER claims the deposit (no buyer    Status = Claimed.
//!      signature needed) to cover their shipping.
//!
//! The `deadline` + seller-claim is the key to real usability: a buyer who flakes will
//! never sign anything, so the seller must be able to claim alone once time runs out.
//! Stellar's sub-cent fees + ~5s settlement make escrowing even a tiny deposit viable.

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

/// Keys for everything this contract stores.
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Monotonic counter used to mint the next order id.
    Counter,
    /// One escrowed order, keyed by its id.
    Order(u64),
}

/// Lifecycle of a single order. An order can only move out of `Funded` once.
#[derive(Clone, PartialEq, Eq, Debug)]
#[contracttype]
pub enum Status {
    Funded,   // deposit is sitting in escrow
    Returned, // delivery confirmed -> deposit returned to the buyer
    Claimed,  // no-show past deadline -> deposit paid to the seller
}

/// The full record of one deposit-escrow order.
#[derive(Clone, Debug)]
#[contracttype]
pub struct Order {
    pub buyer: Address,  // who locked the deposit and confirms delivery
    pub seller: Address, // who can claim the deposit on a no-show
    pub token: Address,  // the asset contract used (e.g. USDC SAC address)
    pub amount: i128,    // the deposit escrowed
    pub deadline: u64,   // unix seconds; at/after this the seller may claim
    pub status: Status,  // current lifecycle state
}

#[contract]
pub struct CodLock;

#[contractimpl]
impl CodLock {
    /// Buyer locks a refundable deposit. Pulls `amount` of `token` from the buyer into
    /// this contract and records the order as `Funded` with its `deadline`. Returns the id.
    ///
    /// `buyer.require_auth()` ensures only the real buyer can spend their own funds.
    pub fn create_order(
        env: Env,
        buyer: Address,
        seller: Address,
        token: Address,
        amount: i128,
        deadline: u64,
    ) -> u64 {
        buyer.require_auth();
        assert!(amount > 0, "amount must be positive");
        assert!(deadline > env.ledger().timestamp(), "deadline must be in the future");

        // Move the buyer's deposit into the contract's own balance (the escrow).
        token::Client::new(&env, &token).transfer(
            &buyer,
            &env.current_contract_address(),
            &amount,
        );

        // Mint the next order id from the instance counter.
        let mut id: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        id += 1;
        env.storage().instance().set(&DataKey::Counter, &id);

        // Persist the order in its initial Funded state.
        let order = Order {
            buyer,
            seller,
            token,
            amount,
            deadline,
            status: Status::Funded,
        };
        env.storage().persistent().set(&DataKey::Order(id), &order);

        id
    }

    /// Buyer confirms the parcel arrived. Returns the deposit to the buyer.
    /// The status guard makes this idempotent-safe: a resolved order can never pay out twice.
    pub fn confirm_delivery(env: Env, order_id: u64) {
        let mut order: Order = env
            .storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .expect("order not found");

        order.buyer.require_auth(); // only the buyer confirms their own delivery
        assert!(order.status == Status::Funded, "order not in funded state");

        // Return the deposit to the buyer from the contract's escrow balance.
        token::Client::new(&env, &order.token).transfer(
            &env.current_contract_address(),
            &order.buyer,
            &order.amount,
        );

        order.status = Status::Returned;
        env.storage().persistent().set(&DataKey::Order(order_id), &order);
    }

    /// Buyer no-show: once the deadline has passed, the seller claims the deposit —
    /// no buyer signature required. The time guard keeps it fair and trustless.
    pub fn claim_expired(env: Env, order_id: u64) {
        let mut order: Order = env
            .storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .expect("order not found");

        order.seller.require_auth(); // only the seller can claim
        assert!(order.status == Status::Funded, "order not in funded state");
        assert!(
            env.ledger().timestamp() >= order.deadline,
            "deadline not reached"
        );

        // Pay the deposit to the seller from the contract's escrow balance.
        token::Client::new(&env, &order.token).transfer(
            &env.current_contract_address(),
            &order.seller,
            &order.amount,
        );

        order.status = Status::Claimed;
        env.storage().persistent().set(&DataKey::Order(order_id), &order);
    }

    /// Read-only: fetch an order's current state (used by the UI).
    pub fn get_order(env: Env, order_id: u64) -> Order {
        env.storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .expect("order not found")
    }
}

#[cfg(test)]
mod test;
