import { IconExternal, IconCopy, IconCheck } from "./icons";
import { useState } from "react";

const CONTRACT_ID = "CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";
const CONTRACT_URL = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;

const FACTS = [
  { k: "Network", v: "Stellar Testnet" },
  { k: "Type", v: "WASM contract (Soroban)" },
  { k: "SDK", v: "soroban-sdk 25" },
  { k: "What it can do", v: "create order · confirm delivery · refund · look up order" },
];

export function ContractPanel() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="contract-view">
      <p className="demo-intro">
        This is the actual program running on Stellar that holds each order's money and releases it
        automatically — no person can touch it in between. You don't need to read the details below;
        it's here as proof the system is real and live, not just a mock-up.
      </p>
      <section className="panel">
        <div className="panel-head">
          <span>Deployed contract</span>
          <a className="view" href={CONTRACT_URL} target="_blank" rel="noreferrer">
            Stellar Expert <IconExternal size={13} />
          </a>
        </div>

        <div className="contract-id-row">
          <code className="contract-id">{CONTRACT_ID}</code>
          <button className="btn ghost sm" onClick={copy}>
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <dl className="facts">
          {FACTS.map((f) => (
            <div key={f.k} className="fact">
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
