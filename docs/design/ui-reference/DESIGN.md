# EskoLokt UI — Design Language (light mode)

Distilled from the reference showcases the owner provided (Orbit settings / login /
dashboards). Follow these recipes; you should rarely need an AI to build a screen.

**Vibe:** refined, minimal, "developer-tool" (Vercel/Linear family). Calm neutral layout,
hairline borders, lots of white space, and **status is the only bright color**. Light mode.

## Stack
- **Tailwind CSS** + a few **shadcn-style primitives**: `Button`, `Input`, `Label`,
  `Switch`, `Separator`, `Card`. Icons: `lucide-react`.
- Fonts: a clean sans for headings (`font-heading`) + a **monospace** for micro-labels and
  numbers (`font-mono`). (Owner picks the exact families; keep them characterful, not default.)

## Tokens (CSS variables — light mode)
| Token | Use |
| --- | --- |
| `--background` | near-white page bg |
| `--foreground` | near-black text |
| `--muted-foreground` | secondary text / labels |
| `--border` | hairline borders (use at `/60`) |
| `--primary` | **brand green** — primary buttons + accents only |
| `--card` | slightly elevated surface |
Status colors (Tailwind): `sky` = locked/pending, `emerald` = delivered/returned,
`amber` = in-transit/awaiting, `rose` = no-show/claimed/error.

## Signature recipes (copy these)
**Micro-label** (the look's fingerprint — over sections, metrics, statuses):
```html
<div class="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Deposit</div>
```
**Card / surface:**
```html
<div class="rounded-xl border border-border/60 bg-background/40 p-4"> … </div>
```
**Stat tile** (label + big mono number):
```html
<div class="rounded-xl border border-border/60 bg-background/40 p-4">
  <div class="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Deposit</div>
  <div class="mt-1 font-mono text-2xl tabular-nums">₱50.00</div>
</div>
```
**Status pill** (swap the color per state):
```html
<span class="inline-flex items-center gap-1.5 rounded bg-emerald-500/12 px-1.5 py-0.5
             font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-600">
  <span class="size-1.5 rounded-full bg-emerald-500"></span> Delivered
</span>
```
**Primary action** (brand green): `<Button size="lg" className="w-full">Lock deposit</Button>`
**Numbers:** always `font-mono tabular-nums` for amounts, deadlines, order ids.

## Do / Don't
- ✅ Neutral grays carry the layout; green only for primary actions; status colors only for status.
- ✅ Hairline borders (`border-border/60`), low-opacity fills (`bg-foreground/[0.03–0.06]`).
- ✅ Mobile-first, single column, thumb-reachable primary buttons near the bottom.
- ❌ No gradients-as-decoration, no drop-shadow-heavy cards, no rainbow of accent colors.
- ❌ Don't put body text in mono — mono is for labels and numbers only.

## Mobile adaptation
The reference uses desktop sidebar/split layouts. For EskoLokt, **collapse to stacked
single-column mobile screens**: header (mono breadcrumb + title) → content cards → a
sticky bottom action bar for the primary action (mirrors the reference's sticky save bar).
