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
import { IconWallet, IconExternal, IconCheck, IconRefresh } from "./icons";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

export function LiveEscrowPanel() {
  const w = useStellarWallet();
  const e = useEscrow(w.publicKey);
  const [seller, setSeller] = useState(DEFAULT_SELLER);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT_XLM);

  const busy = e.status === "pending";

  return (
    <section className="card">
      <h2>
        Live on Testnet <span className="badge">Real contract call</span>
      </h2>
      <p className="demo-intro">
        This runs the real escrow on Stellar's test network using free practice XLM. Lock a small
        deposit into the contract, read its state back from the chain, then release it to the seller —
        each step is a real transaction you can verify on the explorer.
      </p>

      <a className="view" href={STELLAR_EXPLORER_CONTRACT(CONTRACT_ID)} target="_blank" rel="noreferrer">
        Contract {truncate(CONTRACT_ID)} <IconExternal size={13} />
      </a>

      {/* Connect */}
      {!w.isConnected ? (
        <button className="btn primary" onClick={w.connect} disabled={w.isConnecting}>
          <IconWallet size={16} /> {w.isConnecting ? "Connecting…" : "Connect a wallet"}
        </button>
      ) : (
        <p className="muted">Connected: {truncate(w.publicKey!)}</p>
      )}
      {w.connectError && <p className="warn">{w.connectError}</p>}

      {/* Inputs */}
      <label className="field">
        <span>Seller address (receives the funds on release)</span>
        <input value={seller} onChange={(ev) => setSeller(ev.target.value.trim())} spellCheck={false} />
      </label>
      <label className="field">
        <span>Amount (XLM)</span>
        <input value={amount} onChange={(ev) => setAmount(ev.target.value.trim())} inputMode="decimal" />
      </label>

      {/* Steps */}
      <div className="btn-row">
        <button
          className="btn primary"
          onClick={() => e.lock(seller, amount)}
          disabled={!w.isConnected || busy}
        >
          1 · Lock funds
        </button>
        <button className="btn" onClick={() => e.refresh()} disabled={!e.orderId || busy}>
          <IconRefresh size={14} /> 2 · Read order
        </button>
        <button className="btn" onClick={() => e.release()} disabled={!e.orderId || busy}>
          3 · Release to seller
        </button>
      </div>

      {/* Transaction status */}
      {e.status !== "idle" && (
        <div className={`tx-status ${e.status}`}>
          {e.status === "pending" && <p>⏳ {e.action}: waiting for signature / settling…</p>}
          {e.status === "success" && (
            <p>
              <IconCheck size={14} /> {e.action} succeeded.{" "}
              {e.hash && (
                <a href={STELLAR_EXPLORER_TX(e.hash)} target="_blank" rel="noreferrer">
                  View transaction <IconExternal size={12} />
                </a>
              )}
            </p>
          )}
          {e.status === "error" && <p className="warn">⚠ {e.action}: {e.error}</p>}
        </div>
      )}

      {/* On-chain order state */}
      {e.order && (
        <dl className="facts">
          <div className="fact">
            <dt>Order id</dt>
            <dd>{e.orderId}</dd>
          </div>
          <div className="fact">
            <dt>Status (from chain)</dt>
            <dd>{e.order.status}</dd>
          </div>
          <div className="fact">
            <dt>Amount</dt>
            <dd>{e.order.amount} stroops</dd>
          </div>
          <div className="fact">
            <dt>Seller</dt>
            <dd>{truncate(e.order.seller)}</dd>
          </div>
        </dl>
      )}

      <p className="muted">
        Note: a refund is the contract's other branch — it needs the seller's signature, so it isn't
        run in this single-wallet demo.
      </p>
    </section>
  );
}
