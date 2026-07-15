// ─── Seller · Create Order ───────────────────────────────────────────────────
// Plain-language create form. The "time to pay" is chosen with friendly presets
// (1 hour, 1 day…) instead of raw minutes. Success panel shows the delivery code,
// a share link, and a QR (U7a).

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button, Card, MicroLabel, ScreenHeader } from "../ui/primitives";
import { toast } from "../ui/toast";
import { fmtPhp } from "../lib/money";

type Created = { ref: string; deliveryCode: string; shareUrl: string };

// Friendly "how long" presets → minutes.
const TIME_OPTIONS: { label: string; minutes: number }[] = [
  { label: "1 hour", minutes: 60 },
  { label: "6 hours", minutes: 360 },
  { label: "12 hours", minutes: 720 },
  { label: "1 day", minutes: 1440 },
  { label: "2 days", minutes: 2880 },
  { label: "3 days", minutes: 4320 },
];

export function SellerCreateScreen({
  onCreate,
}: {
  onCreate: (input: { itemName: string; deposit: string; deadlineMinutes: number }) => Promise<Created>;
}) {
  const [itemName, setItemName] = useState("");
  const [deposit, setDeposit] = useState("0.50");
  const [minutes, setMinutes] = useState(1440);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Created | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!done) return;
    QRCode.toDataURL(done.shareUrl, { width: 220, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [done]);

  const chosen = TIME_OPTIONS.find((t) => t.minutes === minutes)?.label ?? `${minutes} min`;

  const submit = async () => {
    if (!itemName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setDone(await onCreate({ itemName, deposit, deadlineMinutes: minutes }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  // ─── Success panel ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 md:max-w-2xl">
        <ScreenHeader crumb="Order created" title="Share this with your buyer" />

        {/* Desktop: QR on the left, code + link stacked on the right. */}
        <div className="mt-6 grid gap-3 md:grid-cols-2 md:items-start">
          {qrDataUrl && (
            <Card className="flex flex-col items-center gap-2 md:row-span-2">
              <MicroLabel>Buyer scans this</MicroLabel>
              <img
                src={qrDataUrl}
                alt="Order QR code"
                className="mt-1 rounded-lg md:h-56 md:w-56"
                width={170}
                height={170}
              />
            </Card>
          )}

          <Card className="text-center md:text-left">
            <MicroLabel>Delivery code (write on the parcel)</MicroLabel>
            <div className="mt-1 font-mono text-3xl tracking-[0.3em] tabular-nums">{done.deliveryCode}</div>
          </Card>

          <Card>
            <MicroLabel>Or send this link</MicroLabel>
            <div className="mt-1 truncate font-mono text-xs">{done.shareUrl}</div>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                navigator.clipboard.writeText(done.shareUrl);
                toast.info("Link copied — send it to your buyer");
              }}
            >
              Copy link
            </Button>
          </Card>
        </div>

        <div className="mt-4 text-center md:text-left">
          <button
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => {
              setDone(null);
              setQrDataUrl(null);
              setItemName("");
            }}
          >
            Create another order
          </button>
        </div>
      </div>
    );
  }

  // ─── Create form ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-md px-4 py-8 md:max-w-2xl">
      <ScreenHeader
        crumb="New order"
        title="Create an order"
        subtitle="Your buyer leaves a small refundable deposit. You're covered if they don't show up."
      />

      <Card className="mt-6 space-y-5">
        {/* Item + deposit sit side-by-side on desktop, stacked on mobile. */}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <MicroLabel>What are you selling?</MicroLabel>
            <input
              id="seller-item-name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Blue cotton tee"
              className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
            />
          </label>

          <label className="block">
            <MicroLabel>Refundable deposit</MicroLabel>
            <div className="relative mt-1.5">
              <input
                id="seller-deposit"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                className="h-11 w-full rounded-lg border border-input bg-background pl-3 pr-16 font-mono text-sm tabular-nums outline-none transition-colors focus:border-ring"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs font-medium text-muted-foreground">
                XLM
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              About <span className="font-medium text-foreground">{fmtPhp(deposit)}</span> — a small hold that
              comes back to your buyer on delivery.
            </p>
          </label>
        </div>

        <div>
          <MicroLabel>How long does your buyer have to pay?</MicroLabel>
          <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-6">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.minutes}
                type="button"
                onClick={() => setMinutes(t.minutes)}
                className={`h-10 rounded-lg border text-sm transition-colors ${
                  minutes === t.minutes
                    ? "border-primary bg-primary/[0.08] font-medium text-primary"
                    : "border-border text-muted-foreground hover:border-border hover:bg-foreground/[0.03]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            After <strong>{chosen}</strong>, if they haven't paid you can re-send the link or keep the deposit.
          </p>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end border-t border-border/60 pt-4">
          <Button
            id="seller-create-btn"
            onClick={submit}
            disabled={busy || !itemName.trim()}
            className="md:w-auto md:min-w-[220px] md:px-8"
          >
            {busy ? "Creating…" : "Create order"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
