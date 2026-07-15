// ─── How it works ────────────────────────────────────────────────────────────
// Plain-language, step-by-step guide shown right after a seller signs in (and
// reachable any time from the home screen). No jargon — just what to do.

import { Button, Card, ScreenHeader } from "../ui/primitives";

const STEPS = [
  {
    title: "Create an order",
    body: "Add what you're selling and a small refundable deposit amount. You get a link to send your buyer.",
  },
  {
    title: "Send the link to your buyer",
    body: "Message them the link (or the order code). They open it on their phone.",
  },
  {
    title: "Your buyer leaves the deposit",
    body: "They leave a small deposit to hold the order. It's fully refundable — it just protects your shipping.",
  },
  {
    title: "Hand over the parcel",
    body: "When it arrives, your buyer shows you a code. Enter it — their deposit goes straight back to them, and you keep the sale.",
  },
  {
    title: "If they don't show up",
    body: "If the buyer never shows before the time runs out, you keep the deposit to cover your costs. No chasing, no loss.",
  },
];

export function GuideScreen({
  onDone,
  onPractice,
}: {
  onDone: () => void;
  onPractice: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-28">
      <ScreenHeader
        crumb="How it works"
        title="5 quick steps"
        subtitle="This is how Esko Lokt protects every sale. Takes a minute to read."
      />

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, i) => (
          <li key={i}>
            <Card className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/12 font-heading text-sm text-primary">
                {i + 1}
              </span>
              <div>
                <div className="font-medium">{step.title}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-2">
        <Button id="guide-done-btn" onClick={onDone}>
          Got it — let's go
        </Button>
        <Button id="guide-practice-btn" variant="outline" onClick={onPractice}>
          Try a practice run first
        </Button>
      </div>
    </div>
  );
}
