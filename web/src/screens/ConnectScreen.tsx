// ─── U7b: Connect Screen ──────────────────────────────────────────────────────
// Centered card: connect → show address + two outline buttons for test actions.

import { useState } from "react";
import { Button, Card, MicroLabel, ScreenHeader } from "../ui/primitives";

export function ConnectScreen({
  connected,
  address,
  onConnect,
  onGetTestFunds,
  onAddTrustline,
  onContinue,
}: {
  connected: boolean;
  address: string;
  onConnect: () => Promise<void>;
  onGetTestFunds: () => Promise<void>;
  onAddTrustline?: () => Promise<void>;
  onContinue?: () => void;
}) {
  const [connectBusy, setConnectBusy] = useState(false);
  const [fundsBusy, setFundsBusy] = useState(false);
  const [trustBusy, setTrustBusy] = useState(false);
  const [fundsMsg, setFundsMsg] = useState<string | null>(null);
  const [trustMsg, setTrustMsg] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnectBusy(true);
    try {
      await onConnect();
    } catch (e) {
      console.error("[ConnectScreen] connect failed", e);
    } finally {
      setConnectBusy(false);
    }
  };

  const handleGetTestFunds = async () => {
    setFundsBusy(true);
    setFundsMsg(null);
    try {
      await onGetTestFunds();
      setFundsMsg("Test XLM funded ✓");
    } catch (e) {
      setFundsMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      setFundsBusy(false);
    }
  };

  const handleAddTrustline = async () => {
    if (!onAddTrustline) return;
    setTrustBusy(true);
    setTrustMsg(null);
    try {
      await onAddTrustline();
      setTrustMsg("USDC trustline added ✓");
    } catch (e) {
      setTrustMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      setTrustBusy(false);
    }
  };

  // Truncate long addresses
  const truncate = (addr: string) =>
    addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-8)}` : addr;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12">
      <ScreenHeader crumb="Wallet" title="Connect wallet" />

      {!connected ? (
        <Card className="mt-8 w-full text-center">
          {/* Freighter logo placeholder */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <WalletIcon />
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your Freighter wallet to lock deposits and confirm
            deliveries on Stellar Testnet.
          </p>
          <Button
            id="connect-wallet-btn"
            className="mt-4"
            onClick={handleConnect}
            disabled={connectBusy}
          >
            {connectBusy ? "Connecting…" : "Connect wallet"}
          </Button>
        </Card>
      ) : (
        <Card className="mt-8 w-full space-y-4">
          {/* Address display */}
          <div className="rounded-lg bg-emerald-500/8 px-3 py-2 text-center">
            <MicroLabel>Connected address</MicroLabel>
            <div className="mt-1 font-mono text-xs">{truncate(address)}</div>
          </div>

          <div className="space-y-2">
            <Button
              id="get-test-funds-btn"
              variant="outline"
              onClick={handleGetTestFunds}
              disabled={fundsBusy}
            >
              {fundsBusy ? "Funding…" : "Get test funds"}
            </Button>
            {fundsMsg && (
              <p
                className={`text-center text-xs ${
                  fundsMsg.includes("✓")
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {fundsMsg}
              </p>
            )}

            {onAddTrustline && (
              <>
                <Button
                  id="add-trustline-btn"
                  variant="outline"
                  onClick={handleAddTrustline}
                  disabled={trustBusy}
                >
                  {trustBusy ? "Adding…" : "Add USDC trustline"}
                </Button>
                {trustMsg && (
                  <p
                    className={`text-center text-xs ${
                      trustMsg.includes("✓") ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {trustMsg}
                  </p>
                )}
              </>
            )}
          </div>

          {onContinue && (
            <Button id="connect-continue-btn" onClick={onContinue}>
              Enter app →
            </Button>
          )}

          <p className="text-center text-xs text-muted-foreground">
            These actions only affect Stellar Testnet — no real money is involved.
          </p>
        </Card>
      )}
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function WalletIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      aria-hidden="true"
    >
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
    </svg>
  );
}
