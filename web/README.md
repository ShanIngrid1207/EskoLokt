# COD Lock — Web (Stellar Testnet + Freighter)

A small Vite + React + TypeScript app that satisfies the Stellar **Level 1** wallet
requirements: connect Freighter, show the connected public key, read the XLM balance
from Testnet, and send a Testnet XLM payment signed by Freighter.

> **Testnet only.** This app never uses Mainnet and never asks for a secret key —
> Freighter signs every transaction.

## Stack

- **Vite + React 18 + TypeScript** (client-rendered SPA — no SSR)
- [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) — Horizon + transaction building
- [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) — wallet connect + signing

## Structure

```
web/
  src/
    lib/
      constants.ts        # Testnet passphrase, Horizon URL, explorer link
      freighter.ts        # version-defensive Freighter wrappers
      stellar.ts          # Horizon balance, tx builder, validators, error mapping
    hooks/
      useStellarWallet.ts # connect / disconnect / balance / send state machine
    components/
      StellarWalletPanel.tsx
    App.tsx  main.tsx  styles.css
```

## Setup

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + production build to dist/
npm run preview     # serve the production build
```

## How to test manually

1. Install the **Freighter** browser extension and create/unlock a wallet.
2. In Freighter, switch the network to **Testnet**.
3. Fund your account with test XLM via [Friendbot](https://friendbot.stellar.org)
   (paste your public key) — or the app will tell you it's unfunded.
4. Open the app and click **Connect Freighter Wallet**; approve the prompt.
5. Confirm your truncated public key and **XLM balance** display.
6. In **Send XLM**, paste another Testnet public key, enter a small amount
   (e.g. `1`), optionally a memo, and click **Send XLM**.
7. Approve signing in Freighter. On success you'll see a **transaction hash**
   linking to Stellar Expert, and the balance refreshes.

## Error states handled

Missing Freighter · rejected connection · rejected signing · wrong network ·
unfunded account · Horizon/network errors · non-existent destination
(`op_no_destination`) · invalid public key · invalid/negative/too-precise amount ·
insufficient balance · submission failure · unexpected Freighter response shapes.

## Known limitations / follow-ups

- `Disconnect` clears the **app session** only; Freighter has no API to revoke the
  site permission, so reconnecting won't re-prompt until you remove the site in
  Freighter's settings.
- Spendable balance reserves ~1.5 XLM for the base reserve + fees (kept simple for
  Level 1). A precise reserve calc would read subentry count.
- No automatic Friendbot funding (by design) — the app links you to it instead.
