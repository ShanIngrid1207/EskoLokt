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
          Stellar Wallet <span className="badge">Testnet</span>
        </h2>
        <p className="warn">
          Freighter wallet is required. Install the{" "}
          <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
            Freighter browser extension
          </a>{" "}
          and switch it to <strong>Testnet</strong>.
        </p>
      </section>
    );
  }

  const wrongNetwork = w.isConnected && w.network && w.network.toUpperCase() !== "TESTNET";

  return (
    <section className="card">
      <h2>
        Stellar Wallet <span className="badge">Testnet</span>
      </h2>

      {/* Connection */}
      {!w.isConnected ? (
        <button className="btn primary" onClick={w.connect} disabled={w.isConnecting}>
          <IconWallet size={18} /> {w.isConnecting ? "Connecting…" : "Connect Freighter Wallet"}
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
          Freighter network is “{w.network}”. Switch it to <strong>Testnet</strong> to use this app.
        </p>
      )}

      {w.isConnected && (
        <>
          {/* Balance */}
          <div className="section">
            <div className="row between">
              <h3>Balance</h3>
              <button
                className="btn ghost sm"
                onClick={() => w.refreshBalance()}
                disabled={w.balanceStatus === "loading"}
              >
                <IconRefresh size={14} /> {w.balanceStatus === "loading" ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {w.balanceStatus === "loading" && <p className="muted">Loading balance…</p>}
            {w.balanceStatus === "funded" && (
              <p className="balance">
                {Number(w.balance).toFixed(7)} <span>XLM</span>
              </p>
            )}
            {w.balanceStatus === "unfunded" && (
              <p className="warn">
                Your Testnet account is not funded yet. Fund it with{" "}
                <a href="https://friendbot.stellar.org" target="_blank" rel="noreferrer">
                  Stellar Friendbot
                </a>
                , then Refresh.
              </p>
            )}
            {w.balanceStatus === "error" && <p className="error">{w.balanceError}</p>}
            {w.balanceStatus === "idle" && <p className="muted">—</p>}
          </div>

          {/* Send XLM */}
          <form className="section" onSubmit={onSend}>
            <h3>Send XLM</h3>

            <label>
              Destination address
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="G… recipient public key"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <label>
              Amount (XLM)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.5"
                inputMode="decimal"
              />
            </label>

            <label>
              Memo (optional)
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="order #1234"
                maxLength={28}
              />
            </label>

            <button className="btn primary" type="submit" disabled={w.isSending || !!wrongNetwork}>
              <IconSend size={18} /> {w.isSending ? "Sending…" : "Send XLM"}
            </button>

            {w.txStatus === "pending" && (
              <p className="muted">Submitting transaction… confirm signing in Freighter.</p>
            )}
            {w.txStatus === "success" && w.txHash && (
              <div className="ok">
                <p className="ok-line">
                  <IconCheck size={18} /> Payment sent.
                </p>
                <p className="hash">
                  Tx:{" "}
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
