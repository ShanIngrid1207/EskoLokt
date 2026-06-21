# COD Lock — Trust Model & Go-to-Market Design

**Date:** 2026-06-21
**Status:** Approved direction, pending spec review
**Type:** Product/concept design (not a code spec). One small app change is included at the end.

## Purpose

Resolve the hard questions that decide whether COD Lock is a real product, not just a
demo — and capture defensible answers for the pitch. This doc settles the trust model,
the refund path, regulatory posture, and go-to-market, then defines the single demo
change that makes the model visible on screen.

## The decision in one line

COD Lock is **non-custodial escrow for social-commerce sellers** (Facebook / IG / Viber)
who have no escrow option today. The buyer's money is locked in a smart contract and
**released only after the buyer has received and accepted the item** — protecting both sides,
with refunds that resolve on objective events, never on someone's say-so.

## Trust model: full escrow, release on acceptance

The canonical flow for every order:

1. **Buyer pays the full amount** → locked in the contract. (Framed as *buyer protection*, not COD.)
2. **Seller ships**; the parcel moves through the courier normally.
3. **Buyer receives it** and has a **48-hour inspection window**.
4. **Outcomes:**
   - **Happy, or does nothing** → after the window, funds **auto-release to the seller**.
   - **Confirms early** ("Got it, it's good") → instant release to the seller.
   - **Reports a problem** → the refund path below.

Pitch line: *"Your money sits safely until you've seen your item and you're happy."*

## Fund control: minimal (rules + auto-release)

**No human — not even us — can redirect locked funds.** Money moves only on objective triggers:
buyer accepts, the inspection window times out, or the courier confirms a return. This is the
safest legal posture (see Regulatory) and the most trustworthy to users.

**Consequence (accepted):** subjective "not as described" arguments cannot be *arbitrated* in v1.
They resolve the only objective way — the buyer returns the item.

## Refund path (the "bad parcel" question)

Because the money is still in escrow, refunds are real:

- **Within the inspection window, the buyer can always return for a refund.** The contract never
  judges who is right — it refunds once the **courier confirms the item came back**.
- **Refund amount:** order total **minus return shipping** in v1 (keeps the rule objective and
  protects the seller from pure remorse).
- **Subjective fairness deferred to Phase 2:** having the *seller* absorb shipping when an item is
  genuinely defective requires a judgment call. That arrives later as either a **limited binary
  arbiter** (can only choose refund-buyer vs pay-seller, never redirect funds) or a **reputation
  system** — not in v1.

## How each known problem is answered

| # | Problem | Answer |
|---|---------|--------|
| 1 | Prepay isn't COD | Reframe as **buyer protection** ("Pay safely"), and launch in niches that already prepay (see GTM). |
| 2 | Getting money in/out | Users only ever see **pesos**. Pilot with a **manual concierge ramp**; later integrate a **BSP-registered PH ramp** for peso↔USDC. |
| 3 | Who confirms delivery | **OTP at handover** + **auto-release after the window**; **courier "delivered" status** integrated later. No single dishonest click can break it. |
| 4 | Disputes / bad item | **Return → courier-confirmed → auto-refund** (see Refund path). |
| 5 | Does it make the seller whole | Kills **fake orders** and **rejected-at-door** outright; genuine returns handled by return-refund; defect-shipping fairness in Phase 2. |
| 6 | Regulatory | **Non-custodial** + outsource conversion to a licensed partner (see below). |
| 7 | Why not GCash/Shopee | **Escrow for sellers the big platforms don't cover** (see GTM). |

## Regulatory posture (#6)

The Philippine BSP regulates crypto via its **VASP framework**, plus e-money and AML/KYC rules.
The two triggers are *converting peso↔crypto* and *holding/transferring funds*. The design avoids
being the regulated party:

- **Non-custodial** — the contract holds funds; the company never does.
- **Outsource conversion** to a BSP-registered ramp partner; *they* do the regulated peso↔USDC step
  and KYC. COD Lock never touches pesos.
- **Rely on partner KYC**, adding light verification only for higher-value orders.
- **Pilot inside the rules** — small scale; explore the BSP regulatory sandbox; get PH fintech legal
  advice before handling real money at scale.

> ⚠️ Verify current VASP/e-money rules and partner licensing status with a Philippine fintech lawyer
> before any real-money launch. Treat all regulatory notes here as direction, not legal advice.

## Positioning & go-to-market (#7)

For a Facebook/IG seller today: bank transfer and GCash give **zero protection**; courier COD
protects only the buyer; Shopee/Lazada escrow works **only inside their walls**. Social-commerce
sellers have **no mainstream escrow** — that is the gap.

- **Positioning:** *"The buyer-and-seller protection Shopee gives you — for your own Facebook page."*
- **Don't fight GCash, ride on it:** "Pay with GCash, protected by COD Lock" (GCash as the ramp).
- **Honest caveat:** the incumbents have trust and distribution we don't; we win on **reach beyond
  their walls**, not head-to-head.

**Phased beachhead:**

- **Phase 1 (launch): high-value gadgets + group buys / pre-orders.** Both already prepay (so problem
  #1 disappears) and have the widest trust gap. These prove the model.
- **Phase 2 (expand): everyday COD (the "Joy" market).** Broadest but most prepay-resistant — much
  easier to win after a recognizable "protected by COD Lock" badge exists.

## App change in this pass (the only thing we build now)

Add the **"Report a problem → return → refund"** branch to the **Try it** demo, so a viewer can watch
money go *back* to the customer, not just forward to the seller. Concretely:

- After an order is **Held safely**, add a **"Report a problem"** action alongside "Mark as delivered".
- It shows the parcel being returned and the contract **auto-refunding the customer** (reusing the
  existing refunded state, reframed as the buyer-protection outcome).
- Plain-language log + result line explaining: *"the money was locked the whole time, so the refund is
  automatic and safe."*

**Also added to the demo:** a simulated **OTP-at-handover** step (see Roadmap). The buyer gets a
delivery code; the rider must enter it to release the money — making the "who confirms delivery?"
answer visible on screen. Still simulated.

Everything else in this doc (ramp, courier integration, arbiter, reputation) is **strategy for the
pitch and roadmap — not built now.**

## Roadmap & pitch talking points

Two ideas are part of the plan and worth saying out loud when judges probe. Keep these crisp.

### OTP-at-handover (now shown in the demo)

- **What it is:** the buyer gets a one-time delivery code; they give it to the rider at the door, and
  entering it is what releases the escrow. Proof the parcel actually reached the buyer.
- **What it solves:** problem #3 ("who presses delivered, what stops fraud?") with a concrete,
  believable mechanism instead of a hand-wave.
- **Bonus:** a short code needs no connection, so it ties directly into the **Emergency / offline mode**.
- **Talking point:** *"Money is only released when the buyer hands the rider their one-time code —
  so the seller can't fake a delivery, and it works even with no signal."*

### Deposit-mode (Phase 2 adoption path)

- **What it is:** a lighter option where the buyer locks only a small refundable deposit (~shipping
  cost) and pays the rest cash on delivery, like normal COD.
- **What it solves:** problem #1's adoption wall for the **everyday-COD mass market** — buyers who
  refuse to prepay the full amount. It still kills fake/rejected orders (the deposit covers the
  seller's courier cost).
- **Trade-off:** it protects the seller but not the buyer on the main amount, so it's the *expansion*
  model, not the launch model.
- **Talking point:** *"For buyers who won't prepay, we offer a small refundable deposit — they still
  pay cash on delivery, but the seller is covered against fake and rejected orders."*

## Explicitly NOT in this pass

- Real on-chain execution of the escrow from the UI (still simulated, including the OTP step).
- Any ramp integration (concierge/manual for the pilot).
- Real OTP generation/SMS, courier API, arbiter, reputation, KYC, and deposit-mode — all future phases.

## Open items to verify before a real launch

- Current PH on/off-ramp options, fees, and KYC (e.g. Coins.ph; MoneyGram-on-Stellar for cash).
- BSP VASP/e-money applicability and the sandbox path, with a fintech lawyer.
- Whether couriers expose a reliable "delivered"/"returned" status via API for the niches above.

## Success criteria

A reviewer (or judge) asking any of "how do they get the money?", "who confirms delivery?", "what if
the parcel is bad?", "isn't this just GCash?", or "is this even legal?" gets a clear, consistent
answer grounded in this model — and can watch the refund happen in the **Try it** demo.
