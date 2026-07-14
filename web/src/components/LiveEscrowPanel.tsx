import { useState } from "react";
import { useStellarWallet } from "../hooks/useStellarWallet";
import { useEscrow } from "../hooks/useEscrow";
import {
  DEFAULT_SELLER,
  DEFAULT_AMOUNT_XLM,
  CONTRACT_ID,
  STELLAR_EXPLORER_TX,
  STELLAR_EXPLORER_CONTRACT,
} from "../lib/constants";
import {
  Wallet,
  ExternalLink,
  CheckCircle,
  RotateCw,
  Loader2,
  AlertCircle,
  Lock,
  Send,
  Eye,
} from "lucide-react";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

// ─── Sub-components for a clean, uniform layout ───────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="live-section-label">{children}</p>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>
        {label}
        {hint && <span className="live-field-hint"> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Step button — one of the three sequential actions ────────────────────────
function StepButton({
  step,
  label,
  icon: Icon,
  onClick,
  disabled,
  busy,
}: {
  step: number;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
}) {
  return (
    <button
      className={`live-step-btn${disabled ? " disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="live-step-num">{step}</span>
      <span className="live-step-body">
        {busy ? <Loader2 size={14} className="live-spin" /> : <Icon size={14} />}
        <span>{label}</span>
      </span>
    </button>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function LiveEscrowPanel() {
  const w = useStellarWallet();
  const e = useEscrow(w.publicKey);
  const [seller, setSeller] = useState(DEFAULT_SELLER);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT_XLM);

  const busy = e.status === "pending";

  return (
    <div className="live-layout">
      {/* ── Left column: setup ──────────────────────────────────────────────── */}
      <div className="live-col">

        {/* Wallet connection card */}
        <div className="panel">
          <div className="panel-head">
            <span>Wallet</span>
            {w.isConnected && (
              <span className="live-connected-badge">
                <span className="net-dot" style={{ width: 6, height: 6 }} />
                Connected
              </span>
            )}
          </div>

          <div className="live-panel-body">
            {!w.isConnected ? (
              <>
                <p className="live-helper-text">
                  Connect a Stellar wallet to sign transactions on Testnet. No real money involved.
                </p>
                <button
                  className="btn primary"
                  onClick={w.connect}
                  disabled={w.isConnecting}
                  style={{ width: "100%" }}
                >
                  {w.isConnecting ? (
                    <><Loader2 size={15} className="live-spin" /> Connecting…</>
                  ) : (
                    <><Wallet size={15} /> Connect wallet</>
                  )}
                </button>
              </>
            ) : (
              <div className="fact" style={{ paddingTop: 0, borderTop: "none" }}>
                <dt>Address</dt>
                <dd>
                  <code style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                    {truncate(w.publicKey!)}
                  </code>
                </dd>
              </div>
            )}
            {w.connectError && (
              <p className="live-error-inline">
                <AlertCircle size={13} /> {w.connectError}
              </p>
            )}
          </div>
        </div>

        {/* Parameters card */}
        <div className="panel">
          <div className="panel-head">
            <span>Parameters</span>
          </div>
          <div className="live-panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Seller address" hint="receives funds on release">
              <input
                className="live-input"
                value={seller}
                onChange={(ev) => setSeller(ev.target.value.trim())}
                spellCheck={false}
                disabled={busy}
              />
            </Field>
            <Field label="Amount (XLM)">
              <input
                className="live-input"
                value={amount}
                onChange={(ev) => setAmount(ev.target.value.trim())}
                inputMode="decimal"
                disabled={busy}
              />
            </Field>
          </div>
        </div>

        {/* Contract reference */}
        <div className="panel">
          <div className="panel-head">
            <span>Contract</span>
            <a
              className="view"
              href={STELLAR_EXPLORER_CONTRACT(CONTRACT_ID)}
              target="_blank"
              rel="noreferrer"
            >
              View on explorer <ExternalLink size={11} />
            </a>
          </div>
          <div className="live-panel-body">
            <div className="contract-id" style={{ margin: 0 }}>
              {CONTRACT_ID}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right column: actions + results ────────────────────────────────── */}
      <div className="live-col">

        {/* Steps card */}
        <div className="panel">
          <div className="panel-head">
            <span>Steps</span>
            <span className="muted-xs">Run in order</span>
          </div>
          <div className="live-steps-body">
            <StepButton
              step={1}
              label="Lock funds"
              icon={Lock}
              onClick={() => e.lock(seller, amount)}
              disabled={!w.isConnected || busy}
              busy={busy && e.action === "Lock funds"}
            />
            <div className="live-step-divider" />
            <StepButton
              step={2}
              label="Read order from chain"
              icon={Eye}
              onClick={() => e.refresh()}
              disabled={!e.orderId || busy}
              busy={busy && e.action === "Read order from chain"}
            />
            <div className="live-step-divider" />
            <StepButton
              step={3}
              label="Release to seller"
              icon={Send}
              onClick={() => e.release()}
              disabled={!e.orderId || busy}
              busy={busy && e.action === "Release to seller"}
            />
          </div>
        </div>

        {/* Transaction status */}
        {e.status !== "idle" && (
          <div className={`tx-status ${e.status}`}>
            {e.status === "pending" && (
              <p>
                <Loader2 size={14} className="live-spin" />
                {e.action}: waiting for signature / settling…
              </p>
            )}
            {e.status === "success" && (
              <p>
                <CheckCircle size={14} />
                {e.action} succeeded.{" "}
                {e.hash && (
                  <a href={STELLAR_EXPLORER_TX(e.hash)} target="_blank" rel="noreferrer">
                    View transaction <ExternalLink size={11} />
                  </a>
                )}
              </p>
            )}
            {e.status === "error" && (
              <p>
                <AlertCircle size={14} />
                {e.action}: {e.error}
              </p>
            )}
          </div>
        )}

        {/* On-chain order state */}
        {e.order && (
          <div className="panel">
            <div className="panel-head">
              <span>Order state (from chain)</span>
              <button
                className="btn ghost sm"
                onClick={() => e.refresh()}
                disabled={busy}
                title="Refresh from chain"
              >
                <RotateCw size={13} /> Refresh
              </button>
            </div>
            <dl className="facts">
              <div className="fact">
                <dt>Order ID</dt>
                <dd>{e.orderId}</dd>
              </div>
              <div className="fact">
                <dt>Status</dt>
                <dd>{e.order.status}</dd>
              </div>
              <div className="fact">
                <dt>Amount</dt>
                <dd>{e.order.amount} stroops</dd>
              </div>
              <div className="fact">
                <dt>Seller</dt>
                <dd>
                  <code style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                    {truncate(e.order.seller)}
                  </code>
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Note */}
        <p className="muted-xs" style={{ marginTop: 4, lineHeight: 1.6 }}>
          A refund requires the seller's signature and is not available in this single-wallet demo.
        </p>
      </div>
    </div>
  );
}
