// ─── Seller · Create Order ───────────────────────────────────────────────────
// Plain-language create form. The "time to pay" is chosen with friendly presets
// (1 hour, 1 day…) instead of raw minutes. Success panel shows the delivery code,
// a share link, and a QR (U7a).

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button, Card, MicroLabel, ScreenHeader, StickyActionBar } from "../ui/primitives";
import { toast } from "../ui/toast";

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
      <div className="mx-auto max-w-md px-4 py-8">
        <ScreenHeader crumb="Order created" title="Share this with your buyer" />

        <Card className="mt-6 text-center">
          <MicroLabel>Delivery code (write on the parcel)</MicroLabel>
          <div className="mt-1 font-mono text-3xl tracking-[0.3em] tabular-nums">{done.deliveryCode}</div>
        </Card>

        {qrDataUrl && (
          <Card className="mt-3 flex flex-col items-center gap-2">
            <MicroLabel>Buyer scans this</MicroLabel>
            <img src={qrDataUrl} alt="Order QR code" className="mt-1 rounded-lg" width={170} height={170} />
          </Card>
        )}

        <Card className="mt-3">
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

        <div className="mt-4 text-center">
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
    <div className="mx-auto max-w-md px-4 py-8 pb-28">
      <ScreenHeader
        crumb="New order"
        title="Create an order"
        subtitle="Your buyer leaves a small refundable deposit. You're covered if they don't show up."
      />

      <Card className="mt-6 space-y-5">
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
          <input
            id="seller-deposit"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none transition-colors focus:border-ring"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            A small hold — it comes back to your buyer on delivery.
          </p>
        </label>

        <div>
          <MicroLabel>How long does your buyer have to pay?</MicroLabel>
          <div className="mt-2 grid grid-cols-3 gap-2">
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
      </Card>

      <StickyActionBar>
        <Button id="seller-create-btn" onClick={submit} disabled={busy || !itemName.trim()}>
          {busy ? "Creating…" : "Create order"}
        </Button>
      </StickyActionBar>
    </div>
  );
}
