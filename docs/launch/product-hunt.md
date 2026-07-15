# Esko Lokt — Product Hunt launch assets

> Honest framing: this is a **working Stellar Testnet proof-of-concept**. The escrow
> mechanic is real and on-chain; the cash-in on-ramp (GCash / neighborhood agents /
> SMS) is the named next phase. Don't overclaim — the honesty is part of the pitch.

## Tagline (pick one)

- **Trustless cash-on-delivery for Filipino sellers — a refundable deposit that ends fake orders.**
- Stop losing money to "rejected on delivery." A tiny on-chain deposit, settled in ~5 seconds.
- COD without the fraud: buyers lock a small refundable deposit, sellers stop eating shipping.

## Short description (gallery)

Filipino social-commerce sellers lose thousands a week to fake orders and buyers who
reject parcels at the door — they've already paid for courier and packaging before they
learn the order was bogus. Esko Lokt keeps normal cash-on-delivery, but the buyer locks a
small **refundable deposit** into a Stellar smart contract. Delivered → the deposit comes
straight back. No-show → after a short window the deposit covers the seller's shipping.
Sub-cent fees, ~5-second settlement, no bank or middleman.

## First comment (founder story)

> Hi Product Hunt 👋
>
> Joy sells clothes on a Facebook page in Manila and ships cash-on-delivery through
> couriers like J&T. She loses roughly **₱4,000 a week** to fake orders and "rejected on
> delivery" buyers — she's already paid for courier and packaging before she finds out the
> order was bogus. Cash-on-delivery dominates PH social commerce *because* buyers and
> sellers don't trust each other, and that same distrust is bleeding small sellers dry.
>
> Esko Lokt replaces "trust the stranger" with "trust the contract." The customer still
> pays cash at the door like normal COD — they just lock a small **refundable deposit** into
> a Stellar (Soroban) escrow. On delivery, the buyer confirms with a one-time code the rider
> enters at the door, and the deposit returns to them. If they no-show or reject the parcel,
> after a short window the seller claims the deposit to cover shipping. Only the small
> deposit is ever on-chain; the goods are paid hand-to-hand.
>
> This is a **working Testnet proof-of-concept** — you can connect a Freighter wallet and run
> the whole create → confirm → return loop on-chain right now. What's next is the cash-in
> layer so a buyer with only GCash and cash never has to touch crypto: GCash top-up, a
> neighborhood-agent (sari-sari / padala) network, and SMS/USSD confirmation for weak signal.
>
> Would love your feedback — especially from anyone who's sold or bought COD in PH.

## 60–90s demo recording — shot list

1. **The problem (5s):** open on the Orders dashboard; voiceover "sellers lose ₱4k/week to fake COD orders."
2. **Practice mode (20s):** "How it works" tab → place a sample order → rider enters the delivery code → deposit returned; then "customer didn't accept" → deposit covers the seller. Plain-language, no wallet.
3. **It's real (10s):** "Proof" tab → connect Freighter (Testnet) → show the wallet connected.
4. **Create a real order (20s):** lock a real deposit on Testnet; show the delivery code + the Stellar Expert receipt link.
5. **The dashboard is alive (15s):** switch to Orders → the new order appears as **Held** with a countdown → enter the code → status flips to **Paid back**, deposit returned on-chain.
6. **What's next (10s):** the honesty banner + one line on GCash / agent / SMS cash-in.

## What's next (roadmap — say it out loud)

- **Cash-in on-ramp:** GCash top-up → custodial deposit so buyers never touch crypto.
- **Neighborhood-agent network:** sari-sari / padala counters lock the deposit for cash buyers.
- **SMS/USSD confirm:** release the deposit from any basic phone on weak signal (M-Pesa pattern).
- **Rider/courier integration:** the code step wired into J&T / courier handover.
- **On-chain per-seller order index:** cross-device order history without local storage.
- **Reputation & dispute escalation** for edge cases.

## Links

- Live demo: https://shaningrid1207.github.io/EskoLokt/
- Repo: https://github.com/ShanIngrid1207/EskoLokt
- Contract on Stellar Expert: `https://stellar.expert/explorer/testnet/contract/CAVJDHDQZTVACI25P2HNDPTGOE6BGRKEHFN6ZA3WWSBDF7TT6CYDCVKA`
