import { useState, type FormEvent } from "react";
import { useStellarWallet } from "../hooks/useStellarWallet";
import { STELLAR_EXPLORER_TX } from "../lib/constants";
import { IconWallet, IconRefresh, IconCopy, IconSend, IconCheck, IconExternal } from "./icons";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

export function StellarWalletPanel() {
  const w = useStellarWallet();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!w.publicKey) return;
    try {
      await navigator.clipboard.writeText(w.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available — ignore */
    }
  };

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    w.sendPayment({ destination, amount, memo });
  };

  // --- Freighter not installed ---
  if (w.installed === false) {
    return (
      <section className="card">
        <h2>
          Wallet <span className="badge">Safe test</span>
        </h2>
        <p className="demo-intro">
          This part is optional and just for the curious — it lets you try a pretend payment using
          free practice money. Nothing real is ever spent.
        </p>
        <p className="warn">
          To try it you'll need the free{" "}
          <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
            Freighter
          </a>{" "}
          browser add-on, set to its <strong>practice mode</strong>.
        </p>
      </section>
    );
  }

  const wrongNetwork = w.isConnected && w.network && w.network.toUpperCase() !== "TESTNET";

  return (
    <section className="card">
      <h2>
        Wallet <span className="badge">Safe test</span>
      </h2>

      <p className="demo-intro">
        Optional, just for the curious. It sends a pretend payment using free practice money —
        nothing real is ever spent.
      </p>

      {/* Connection */}
      {!w.isConnected ? (
        <button className="btn primary" onClick={w.connect} disabled={w.isConnecting}>
          <IconWallet size={18} /> {w.isConnecting ? "Connecting…" : "Connect wallet"}
        </button>
      ) : (
        <div className="row between">
          <div className="addr">
            <span className="label">Connected</span>
            <code title={w.publicKey ?? ""}>{w.publicKey ? truncate(w.publicKey) : ""}</code>
            <button className="btn ghost sm" onClick={onCopy}>
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button className="btn ghost" onClick={w.disconnect}>
            Disconnect
          </button>
        </div>
      )}

      {w.connectError && <p className="error">{w.connectError}</p>}
      {wrongNetwork && (
        <p className="warn">
          Your wallet is on the wrong network. Switch it to <strong>practice mode</strong> to use this.
        </p>
      )}

      {w.isConnected && (
        <>
          {/* Balance */}
          <div className="section">
            <div className="row between">
              <h3>Practice balance</h3>
              <button
                className="btn ghost sm"
                onClick={() => w.refreshBalance()}
                disabled={w.balanceStatus === "loading"}
              >
                <IconRefresh size={14} /> {w.balanceStatus === "loading" ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {w.balanceStatus === "loading" && <p className="muted">Loading…</p>}
            {w.balanceStatus === "funded" && (
              <p className="balance">
                {Number(w.balance).toFixed(2)} <span>test coins</span>
              </p>
            )}
            {w.balanceStatus === "unfunded" && (
              <p className="warn">
                Your test wallet has no practice coins yet. Get some free from the{" "}
                <a href="https://friendbot.stellar.org" target="_blank" rel="noreferrer">
                  practice faucet
                </a>
                , then Refresh.
              </p>
            )}
            {w.balanceStatus === "error" && <p className="error">{w.balanceError}</p>}
            {w.balanceStatus === "idle" && <p className="muted">—</p>}
          </div>

          {/* Send XLM */}
          <form className="section" onSubmit={onSend}>
            <h3>Send a test payment</h3>

            <label>
              Who to pay
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Paste the other wallet's address"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <label>
              Amount (test coins)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.5"
                inputMode="decimal"
              />
            </label>

            <label>
              Note (optional)
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="order #1234"
                maxLength={28}
              />
            </label>

            <button className="btn primary" type="submit" disabled={w.isSending || !!wrongNetwork}>
              <IconSend size={18} /> {w.isSending ? "Sending…" : "Send test payment"}
            </button>

            {w.txStatus === "pending" && (
              <p className="muted">Sending… confirm it in your wallet pop-up.</p>
            )}
            {w.txStatus === "success" && w.txHash && (
              <div className="ok">
                <p className="ok-line">
                  <IconCheck size={18} /> Payment sent.
                </p>
                <p className="hash">
                  Receipt:{" "}
                  <a href={STELLAR_EXPLORER_TX(w.txHash)} target="_blank" rel="noreferrer">
                    {truncate(w.txHash)} <IconExternal size={13} />
                  </a>
                </p>
              </div>
            )}
            {w.txStatus === "error" && <p className="error">{w.txError}</p>}
          </form>
        </>
      )}
    </section>
  );
}
