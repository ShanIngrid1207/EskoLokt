# COD Lock — Usability redesign for real sellers ("Joy")

**Date:** 2026-06-21
**Status:** Approved direction, pending spec review
**App:** `web/` (Vite + React) in the CodLock repo

## Goal

Make the COD Lock web app genuinely usable for a **non-technical Filipino COD seller like Joy** — someone who thinks in *orders, customers, pesos, "delivered," and "returned,"* not in *XLM, public keys, escrow, or Testnet.* Today the page is organized like a crypto wallet; we want it organized like Joy's actual job.

## Audience (decided)

Primary: **real sellers like Joy** (Facebook-page clothing seller, ships COD, loses money to fake/rejected orders). Not crypto users. Not developers.

## Scope (decided)

**Reframe the page around Joy's workflow, keep the escrow simulated, and demote the live crypto wallet.** We are explicitly **not** wiring the real on-chain escrow flow (create_order / confirm_delivery / refund via Freighter + USDC + trustlines) in this pass — that would make the app *harder* for Joy and her customers (extension installs, trustlines, signing, funding) and is the most likely thing to break during the live demo. High effort, worse usability for the target user.

### In scope
1. Plain-language copy everywhere (remove crypto jargon).
2. Reframe the interactive demo as Joy's real workflow with a tiny realistic form.
3. A guided, "can't-get-lost" path with first-time intro and plain-language tooltips.
4. Demote the live Stellar wallet to a small optional "Proof it's real" area.
5. Trust & safety cues in Joy's terms.
6. Pesos (₱) as the primary money unit; USDC mentioned only quietly, if at all.

### Out of scope (this pass)
- Real on-chain escrow calls / Freighter-signed contract invocations.
- Multi-language (Tagalog) localization — English plain language only for now (note as a future idea).
- Backend, accounts, persistence, real courier integration.

## Design

### 1. Language: jargon → Joy's words

A consistent vocabulary swap across the whole page:

| Today (crypto) | Joy's language |
|---|---|
| USDC / XLM / token | **₱ (pesos)** — the order amount |
| Escrow / Soroban contract | **Safe hold** / "held safely until delivery" |
| Buyer prepays into escrow | **Customer pays up front, money is locked** |
| confirm_delivery() | **Mark as delivered** |
| refund_order() | **Refund the customer** |
| create_order() | **Create an order** |
| Wallet / public key (G…) | hidden from Joy; only in "Proof it's real" |
| Testnet / Freighter | hidden from main flow; in "Proof it's real" with a "this is a safe test, no real money" note |
| Memo | **Note (e.g. order #1234)** |

Function names like `create_order()` are removed from the user-facing event log; the log becomes plain sentences ("You created an order for Maria — ₱500 is now held safely.").

### 2. The demo becomes Joy's workflow

Rework `EscrowDemo.tsx` so it reads as Joy doing her job, not an abstract escrow:

- A tiny **"Create an order"** form: *Customer name* (e.g. "Maria") and *Amount in ₱* (default ₱500). This makes it feel like her real task instead of a fixed "500 USDC".
- Pipeline relabeled: **Customer → Held safely → You (seller)**.
- Buttons in Joy's words and ordered as a guided flow:
  1. **Create the order** (customer's ₱ is locked)
  2. **Mark as delivered** → you get paid
  3. **Refund the customer** → money goes back (only available while held)
  4. **Start over**
- Status pill in plain words: *Waiting → Money held safely → You got paid → Customer refunded.*
- The moving money chip shows the **₱ amount the user typed**.
- Event log: plain-language sentences using the customer name and ₱ amount, screen-reader friendly (keep the existing `aria-live`).

Still 100% simulated (no wallet, no chain) — clearly labeled "Practice mode — no real money."

### 3. Guided, can't-get-lost path

- A short, friendly **first-time intro** at the top of the demo: one sentence on what Joy is about to try ("Try it: create a pretend order and see how the money stays safe until your customer gets it.").
- **One clear next-step hint** visible at each state (reuse the existing result line, in Joy's words).
- **Plain-language tooltips** on any term that can't be fully removed (e.g. an info dot on "held safely" → "The money waits in a neutral lock. You can't spend it and neither can the customer until delivery is settled.").
- Disabled buttons stay disabled with a reason on hover ("Mark as delivered becomes available after you create an order.").

### 4. Demote the live wallet → "Proof it's real"

- Move the `StellarWalletPanel` out of the main flow into a small, collapsed-by-default section near the bottom titled something like **"For the curious: see it really runs on Stellar."**
- Add a one-line reassurance: *"This is a safe test network — no real money is involved."*
- Keep all its current functionality; just stop it being the scary main attraction. Joy never has to touch it to understand or "use" the product.

### 5. Trust & safety cues (Joy's terms)

Reinforce the value proposition in her language in the hero and "how it works":
- "You only get paid when it's delivered."
- "No one can touch the money in the middle — not the courier, not us."
- "If the parcel comes back, your customer is refunded automatically."
- Replace the techy trust-row chips (`~5s settlement`, `Sub-cent fees`, `Freighter-signed`, `Testnet only`) with seller-meaningful ones (e.g. *"Money locked safely," "Automatic refunds," "No bank in the middle," "Free to try"*).

## Components touched

- `web/src/App.tsx` — hero/trust-row/how-it-works copy; move wallet into a collapsed "Proof it's real" section; section headings in Joy's language.
- `web/src/components/EscrowDemo.tsx` — the big one: add the create-order form (name + ₱ amount), relabel pipeline/buttons/status/log, add first-time intro and tooltips, keep it simulated.
- `web/src/components/StellarWalletPanel.tsx` — minor copy reassurance; wrap in a collapsible container (collapse logic likely in App).
- `web/src/styles.css` — styles for the new form, tooltips, collapsible section, and reworded chips.
- Possibly a small shared tooltip/info-dot helper if one doesn't already exist.

## Data flow

Unchanged and simple: all demo state stays local React state in `EscrowDemo` (`idle → funded → released | refunded`), now parameterized by the typed customer name and ₱ amount. No network, no persistence.

## Error / edge handling

- Amount field: accept only positive numbers; default ₱500; ignore/disable "Create the order" if blank or ≤ 0, with a gentle inline hint.
- Customer name optional; if blank, fall back to "your customer" in the copy.
- Existing wallet error/network states preserved as-is inside the demoted section.

## Testing / verification

- Manual visual check: run `npm run dev` in `web/`, screenshot the page, confirm no crypto jargon appears in the main flow (hero → how-it-works → demo).
- Walk the demo end-to-end: create order for "Maria" at ₱500 → mark delivered → confirm log + status read in plain language; repeat with refund path.
- Confirm the wallet section is collapsed by default and the page is understandable without ever opening it.
- Keyboard/screen-reader: tab through demo controls; confirm `aria-live` result line still announces state changes.

## Success criteria

A non-technical person can land on the page and, **without any crypto knowledge and without opening the wallet section**, understand what COD Lock does and complete the practice order flow, seeing in plain language that the money is held safely and released only on delivery (or refunded on return).

## Future ideas (not now)

- Tagalog / bilingual copy.
- Actually wiring the real escrow flow for a guided "live" mode with heavy hand-holding.
- Generating a shareable "pay-to-order" link Joy can send a customer.
