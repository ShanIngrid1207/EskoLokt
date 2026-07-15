# EskoLokt spotlight tour — design

**Date:** 2026-07-15
**Status:** Approved (design), ready for implementation plan

## Problem

The current onboarding is a standalone slideshow (`GuideScreen`): five abstract
cards on a separate `guide` route that explain the escrow concept but never touch
the real app. The owner wants it to work like the **Quest HQ** product tour
(`quest-hq-command-center/taskmanagement/js/views/TourView.js`): dim the real
screen, spotlight an actual on-screen button with an amber-style ring, and float
a tooltip + arrow pointing at it.

## Goal

Replace the slideshow with a Quest-style **spotlight tour** that overlays the real
EskoLokt home screen, points at real elements, keeps the existing hands-on
"type the code" moment as one centered step, and uses **EskoLokt's own green**
(not Quest's amber).

## Non-goals

- No redesign of the home/dashboard screens themselves (only invisible anchor
  attributes are added).
- No new dependencies — dependency-free, like the Quest original.
- No change to buyer-only flows or the practice mode.

## Approach

Port Quest's `TourView` to a React/TSX component, `TourOverlay`, styled with
Tailwind using EskoLokt tokens. It renders on top of the `home` route.

### Component: `TourOverlay`

Mirrors the mechanics of the Quest original:

- **Dim + spotlight** — a fixed highlight box with `box-shadow: 0 0 0 2px <green>,
  0 0 0 9999px rgba(0,0,0,.6)` (ring + full-screen dim in one).
- **Tooltip + arrow** anchored to the target, flipping above/below to stay in the
  viewport; arrow points at the target's horizontal center (clamped).
- **Footer**: dots + `Skip` / `Back` / `Next` (`Next` reads `Done` on the last
  step). `Back` hidden on step 0.
- **Keyboard**: `Esc` = skip/close, `←`/`→` = prev/next.
- **Reposition** on `resize` and `scroll`; `scrollIntoView` the target first.
- **Visibility-aware**: a step whose target selector isn't present/visible is
  filtered out at start. This is what lets one step list serve BOTH layouts —
  desktop `SellerDashboard` and mobile `HomeScreen` show different elements, and
  only the visible ones get spotlighted.
- **Centered steps**: when a step has no selector (welcome, code moment, closing),
  the tooltip centers and the spotlight hides.

### Colors (EskoLokt, not Quest)

- Spotlight ring + active dot + primary button: `--el-primary` (`152 55% 38%`).
- Ring focus glow may use `--el-ring` (`152 45% 40%`).
- Dim overlay: `rgba(0,0,0,.6)`.
- Tooltip surface/border/text: existing `card` / `border` / `foreground` tokens.

### Anchors

Add invisible `data-tour="<key>"` attributes to existing elements (no visual
change). Equivalent elements in both layouts share a key so the visible one is
spotlighted:

| key           | HomeScreen (mobile)          | SellerDashboard (desktop)        |
|---------------|------------------------------|----------------------------------|
| `create`      | "Create an order" card       | "New order" button               |
| `buy`         | "Paste your order link" card | (skipped — not present)          |
| `orders`      | orders list                  | orders table                     |
| `howitworks`  | "How it works" button        | sidebar "How it works"           |

### Steps (role/visibility-aware order)

1. **Welcome** (centered): "A 20-second tour of EskoLokt. Replay it anytime from
   *How it works*."
2. Spotlight `create`: "Start here — create an order. You get a protected deposit
   and a link to send your buyer."
3. Spotlight `buy`: "A buyer sent you a link? Open it here." (auto-skipped on
   desktop where there's no paste-link card)
4. **Hands-on code moment** (centered): the preserved `CodeMoment` interactive —
   shows `1234`, buyer types it, ✅ "the deposit just went back to your buyer."
5. Spotlight `orders`: "Every order and its status lives here."
6. Spotlight `howitworks`: "Replay this tour anytime from here."
7. **You're all set** (centered): closing.

## Wiring changes (`App.tsx`)

- New `tourOpen` state. First sign-in lands on `home` (not `guide`) and
  auto-opens the tour once, gated by the existing `eskolokt.seenGuide` flag.
- Finishing or skipping the tour sets `eskolokt.seenGuide = "1"`.
- The **How it works** button (`onGuide` in both layouts) opens the tour overlay
  instead of `setRoute("guide")`.
- `TourOverlay` renders alongside the `home` route so it sits over the real UI.

## Removals

- Delete the `GuideScreen` slideshow component and the `guide` route branch.
- Remove the `?preview=guide` design preview.
- Preserve the `CodeMoment` interactive by moving it into `TourOverlay` (or a
  small shared module it imports).

## Edge cases

- **Empty dashboard** (new seller, no orders): the `orders` target still exists
  (the empty-state card / "Create your first order"), so its step is fine; if a
  target is genuinely absent it's skipped by the visibility filter.
- **Resize across the md breakpoint mid-tour**: reposition handler re-measures;
  worst case a now-hidden target's step shows centered until Next. Acceptable.
- **Reduced motion**: transitions are short; respect `prefers-reduced-motion` by
  disabling the position tween.

## Testing

- Unit: `buildSteps` filters out steps whose selector is absent; centered vs
  anchored placement math clamps to viewport.
- Manual (headless screenshot per house workflow): new-user auto-start on both
  mobile and desktop widths; replay via How it works; code-moment success state;
  Skip/Esc persists the seen flag.
