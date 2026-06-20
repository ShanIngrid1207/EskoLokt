#![no_std]
//! COD Lock — trustless cash-on-delivery escrow for Filipino social-commerce sellers.
//!
//! Flow that the MVP proves end-to-end:
//!   1. Buyer funds an order  -> USDC moves into this contract (escrow). Status = Funded.
//!   2. Buyer confirms receipt -> contract pays the seller.            Status = Released.
//!   3. (Fork) Seller refunds  -> contract returns USDC to the buyer.  Status = Refunded.
//!
//! Stellar is essential here: sub-cent fees + ~5s settlement make holding small COD
//! amounts in a neutral on-chain escrow actually viable, with no bank or middleman.

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
    Funded,   // money is sitting in escrow
    Released, // money was paid to the seller (delivery confirmed)
    Refunded, // money was returned to the buyer (delivery failed)
}

/// The full record of one COD order held in escrow.
#[derive(Clone, Debug)]
#[contracttype]
pub struct Order {
    pub buyer: Address,   // who paid and who confirms delivery / receives refunds
    pub seller: Address,  // who gets paid on confirmation / can trigger a refund
    pub token: Address,   // the asset contract used (e.g. USDC SAC address)
    pub amount: i128,     // amount escrowed
    pub status: Status,   // current lifecycle state
}

#[contract]
pub struct CodLock;

#[contractimpl]
impl CodLock {
    /// Buyer funds a new order. Pulls `amount` of `token` from the buyer into this
    /// contract and records the order as `Funded`. Returns the new order id.
    ///
    /// `buyer.require_auth()` ensures only the real buyer can spend their own funds.
    pub fn create_order(
        env: Env,
        buyer: Address,
        seller: Address,
        token: Address,
        amount: i128,
    ) -> u64 {
        buyer.require_auth();
        assert!(amount > 0, "amount must be positive");

        // Move the buyer's USDC into the contract's own balance (the escrow).
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
            status: Status::Funded,
        };
        env.storage().persistent().set(&DataKey::Order(id), &order);

        id
    }

    /// Buyer confirms the parcel arrived. Releases the escrow to the seller.
    /// The status guard makes this idempotent-safe: a Released/Refunded order
    /// can never be paid out a second time.
    pub fn confirm_delivery(env: Env, order_id: u64) {
        let mut order: Order = env
            .storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .expect("order not found");

        order.buyer.require_auth(); // only the buyer can confirm their own delivery
        assert!(order.status == Status::Funded, "order not in funded state");

        // Pay the seller from the contract's escrow balance.
        token::Client::new(&env, &order.token).transfer(
            &env.current_contract_address(),
            &order.seller,
            &order.amount,
        );

        order.status = Status::Released;
        env.storage().persistent().set(&DataKey::Order(order_id), &order);
    }

    /// Seller refunds the buyer (e.g. the COD parcel bounced back undelivered).
    /// Returns the escrow to the buyer. Same status guard prevents double-spend.
    pub fn refund_order(env: Env, order_id: u64) {
        let mut order: Order = env
            .storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .expect("order not found");

        order.seller.require_auth(); // only the seller can trigger the refund
        assert!(order.status == Status::Funded, "order not in funded state");

        // Return the escrow to the buyer.
        token::Client::new(&env, &order.token).transfer(
            &env.current_contract_address(),
            &order.buyer,
            &order.amount,
        );

        order.status = Status::Refunded;
        env.storage().persistent().set(&DataKey::Order(order_id), &order);
    }

    /// Read-only: fetch an order's current state (used by the UI / demo).
    pub fn get_order(env: Env, order_id: u64) -> Order {
        env.storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .expect("order not found")
    }
}

#[cfg(test)]
mod test;
