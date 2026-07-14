# Esko Lokt (COD Lock) — UI & Integrated Frontend (`yohan-ui`)

> Trustless cash-on-delivery escrow on Stellar — buyers prepay a small refundable deposit into a smart contract, sellers get paid cash on delivery without shipping fraud risk, and deposits auto-settle on confirmed delivery or return.

---

## Quick Description

**Esko Lokt** is an interactive, modern web application and Stellar smart contract system built for Filipino social-commerce sellers. It eliminates shipping fraud and fake orders in Cash-on-Delivery (COD) transactions without requiring customers or riders to understand cryptocurrency or blockchain mechanics.

This branch (`yohan-ui`) integrates the complete front-end dashboard, interactive guides, offline SMS/USSD mobile fallback simulations, and real Stellar Testnet contract invocations into a unified, high-performance web experience.

---

## Walkthrough

The web application is structured around four primary views accessible from the Efferd-inspired left sidebar:

1. **Orders Dashboard (`/`)**
   - **KPI Stat Cards:** High-level summary of total orders, volume (`₱14,610`), active escrowed orders, and paid-out settlements with trend indicators.
   - **Order List & Filters:** Real-time search, sorting, and status filtering (`Held`, `Paid`, `Refunded`) written in plain seller language.
   - **Stellar Receipt Links:** Direct links to verify transactions and escrow settlements on the Stellar Testnet block explorer.

2. **How It Works & Offline Guides (`GuideView`)**
   - **Step-by-Step Overview:** Explains the escrow flow without technical jargon.
   - **Interactive Escrow Demo:** Lets users test locking a deposit and releasing funds in a simulated environment.
   - **Offline Options (No Signal / Feature Phone Fallback):**
     - **Pay on Delivery (Counter / Rider Flow):** Customer generates an offline delivery code to show the rider at the door.
     - **Pay by Text (USSD / SMS Feature Phone Mockup):** Authentic full-size smartphone mockup simulating an offline `*123*456#` USSD menu where customers can confirm delivery without mobile data.

3. **Proof It's Real (`ProofView`)**
   - Transparent breakdown of the deployed Soroban smart contract on Stellar Testnet, including live contract ID (`CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN`) and transaction records.

4. **Live on Testnet (`LiveEscrowPanel`)**
   - Runs live, real-money (practice XLM/USDC) Soroban contract invocations directly from your connected Stellar wallet (`StellarWalletsKit`).
   - Two-column layout: Setup parameters on the left, sequential actions (`1. Lock funds` → `2. Read order` → `3. Release to seller`) on the right.

5. **Mobile Developer Harness (`/?dev=1`)**
   - Dedicated mobile view harness for testing mobile order creation, wallet connection, and emergency offline screens.

---

## How It Works

1. **Agreement & Checkout:** Customer orders item via social media (Facebook/Instagram/TikTok). Instead of risking a fake COD order, the customer locks a small refundable deposit (e.g., ₱50) into the Esko Lokt escrow contract.
2. **Transit & Neutrality:** Funds remain locked neutrally in the smart contract while the parcel is in transit. Neither party holds the funds.
3. **Delivery & Settlement:**
   - **Delivered:** Customer pays cash on delivery to the rider. The delivery is confirmed (via web or offline SMS/rider code), instantly releasing the deposit back to the customer.
   - **Returned / No-Show:** If the customer rejects the delivery or gives a fake address, the contract releases the deposit to the seller to cover wasted courier and packaging costs.

---

## Scenario

**Joy's Closet (Manila Clothing Shop):**
Joy ships clothing across the Philippines via J&T Express. Every week, she loses ~₱4,000 to "rejected on delivery" or bogus orders where she pays shipping fees out of pocket.
By asking customers to lock a nominal ₱50 deposit via Esko Lokt before dispatching, Joy ensures 100% buyer intent. When the rider delivers the package and collects cash, Joy receives her cash payment and the customer gets their ₱50 deposit back automatically.

---

## How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Stellar/Freighter Wallet](https://www.freighter.app/) browser extension configured for **Stellar Testnet**

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:5173/](http://localhost:5173/).
To view the mobile harness directly, open [http://localhost:5173/?dev=1](http://localhost:5173/?dev=1).

### 3. Build & Verify Type Safety
```bash
npm run typecheck
npm run build
```

---

## Smart Contract Details

- **Network:** Stellar Testnet
- **Contract ID:** `CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN`
- **Explorer:** [Stellar Expert Contract View](https://stellar.expert/explorer/testnet/contract/CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN)

### Backend Integration Integrity
The frontend integrates with the deployed backend contract via `web/src/lib/escrow.ts` and `web/src/hooks/useEscrow.ts`, maintaining full synchronization with the Soroban smart contract methods (`create_order`, `confirm_delivery`, `claim_expired`).

---

## License

MIT License — Copyright (c) 2026 Quest Construction
