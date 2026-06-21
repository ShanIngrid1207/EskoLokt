import { IconExternal, IconCopy, IconCheck } from "./icons";
import { useState } from "react";

const CONTRACT_ID = "CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";
const CONTRACT_URL = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;

const FACTS = [
  { k: "Runs on", v: "Stellar (a public network)" },
  { k: "Status", v: "Live and running" },
  { k: "Who controls it", v: "No one — it runs on its own" },
  { k: "What it can do", v: "place an order · confirm delivery · refund · check an order" },
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
      <section className="panel">
        <div className="panel-head">
          <span>The live program</span>
          <a className="view" href={CONTRACT_URL} target="_blank" rel="noreferrer">
            See it live <IconExternal size={13} />
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
