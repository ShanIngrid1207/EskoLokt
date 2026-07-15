// ─── U3: Seller · Create Order ───────────────────────────────────────────────
// Props-only screen.  Wire to stub.onCreate in the dev harness.
// The QR code in the success panel is implemented here (U7a).

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Button,
  Card,
  MicroLabel,
  ScreenHeader,
  StickyActionBar,
} from "../ui/primitives";

type Created = { ref: string; deliveryCode: string; shareUrl: string };

export function SellerCreateScreen({
  onCreate,
}: {
  onCreate: (input: {
    itemName: string;
    deposit: string;
    deadlineMinutes: number;
  }) => Promise<Created>;
}) {
  const [itemName, setItemName] = useState("");
  const [deposit, setDeposit] = useState("0.50");
  const [minutes, setMinutes] = useState(1440);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Created | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate QR code when order is created (U7a)
  useEffect(() => {
    if (!done) return;
    QRCode.toDataURL(done.shareUrl, { width: 200, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [done]);

  const submit = async () => {
    if (!itemName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setDone(
        await onCreate({ itemName, deposit, deadlineMinutes: minutes })
      );
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
        <ScreenHeader
          crumb="Seller · Order created"
          title="Share this with your buyer"
        />

        <Card className="mt-6 text-center">
          <MicroLabel>Delivery code (write on the parcel)</MicroLabel>
          <div className="mt-1 font-mono text-3xl tracking-[0.3em] tabular-nums">
            {done.deliveryCode}
          </div>
        </Card>

        <Card className="mt-3">
          <MicroLabel>Share link</MicroLabel>
          <div className="mt-1 truncate font-mono text-xs">{done.shareUrl}</div>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => navigator.clipboard.writeText(done.shareUrl)}
          >
            Copy link
          </Button>
        </Card>

        {/* U7a — QR code of the share URL */}
        {qrDataUrl ? (
          <Card className="mt-3 flex flex-col items-center gap-2">
            <MicroLabel>Scan to open order</MicroLabel>
            <img
              src={qrDataUrl}
              alt={`QR code for ${done.shareUrl}`}
              className="mt-1 rounded-lg"
              width={160}
              height={160}
            />
          </Card>
        ) : (
          <Card className="mt-3 flex items-center justify-center py-6">
            <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          </Card>
        )}

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
        crumb="Seller · New order"
        title="Create an order"
        subtitle="Your buyer locks a small refundable deposit. You're covered if they no-show."
      />

      <Card className="mt-6 space-y-4">
        <Labelled label="Item">
          <input
            id="seller-item-name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Blue cotton tee"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
          />
        </Labelled>

        <Labelled label="Deposit (XLM)">
          <input
            id="seller-deposit"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            inputMode="decimal"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-ring transition-colors"
          />
        </Labelled>

        <Labelled label="Auto-claim after (minutes)">
          <input
            id="seller-deadline-minutes"
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-ring transition-colors"
          />
        </Labelled>

        {error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}
      </Card>

      <StickyActionBar>
        <Button
          id="seller-create-btn"
          onClick={submit}
          disabled={busy || !itemName.trim()}
        >
          {busy ? "Creating…" : "Create order"}
        </Button>
      </StickyActionBar>
    </div>
  );
}

// ─── Local helper ─────────────────────────────────────────────────────────────
function Labelled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <MicroLabel>{label}</MicroLabel>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
