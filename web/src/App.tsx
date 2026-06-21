import { StellarWalletPanel } from "./components/StellarWalletPanel";
import { EscrowDemo } from "./components/EscrowDemo";
import {
  IconBolt,
  IconShield,
  IconBuyer,
  IconCheck,
  IconRefund,
  IconWallet,
  IconExternal,
  IconArrowRight,
} from "./components/icons";

const CONTRACT_ID = "CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";
const CONTRACT_URL = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;
const REPO_URL = "https://github.com/ShanIngrid1207/CodLock";

export default function App() {
  return (
    <div className="app">
      {/* Top bar */}
      <header className="nav">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <IconShield size={20} />
          </span>
          COD&nbsp;Lock
        </a>
        <nav className="nav-links">
          <a href="#how">How it works</a>
          <a href="#demo">Demo</a>
          <a href="#wallet">Wallet</a>
          <a className="nav-cta" href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="hero">
          <span className="pill">
            <IconBolt size={14} /> Built on Stellar · Testnet
          </span>
          <h1>
            Cash-on-delivery,
            <br />
            <span className="grad">without the trust fall.</span>
          </h1>
          <p className="lede">
            Buyers prepay an order into a smart contract. Sellers get paid the moment delivery is
            confirmed — and buyers are automatically refunded if the parcel bounces back. No bank, no
            middleman holding the money.
          </p>
          <div className="hero-cta">
            <a className="btn primary lg" href="#demo">
              Try the demo <IconArrowRight size={18} />
            </a>
            <a className="btn ghost lg" href="#wallet">
              <IconWallet size={18} /> Open live wallet
            </a>
          </div>
          <div className="trust-row">
            <span>~5s settlement</span>
            <span className="dot" />
            <span>Sub-cent fees</span>
            <span className="dot" />
            <span>Freighter-signed</span>
            <span className="dot" />
            <span>Testnet only</span>
          </div>
        </section>

        {/* How it works */}
        <section className="how" id="how">
          <span className="kicker center">How it works</span>
          <h2 className="section-title">Three steps, one honest outcome</h2>
          <div className="steps">
            <article className="step">
              <span className="step-icon blue">
                <IconBuyer size={24} />
              </span>
              <span className="step-no">Step 1</span>
              <h3>Buyer prepays into escrow</h3>
              <p>At checkout the buyer locks the order amount into the contract. Funds are frozen, not paid out.</p>
            </article>
            <article className="step">
              <span className="step-icon green">
                <IconCheck size={24} />
              </span>
              <span className="step-no">Step 2</span>
              <h3>Delivery confirmed → seller paid</h3>
              <p>When the parcel is received, the contract instantly releases the funds to the seller.</p>
            </article>
            <article className="step">
              <span className="step-icon amber">
                <IconRefund size={24} />
              </span>
              <span className="step-no">Step 3</span>
              <h3>Returned → buyer refunded</h3>
              <p>If the parcel bounces back, the escrow returns the money to the buyer. Nobody loses.</p>
            </article>
          </div>
        </section>

        {/* Interactive simulated demo */}
        <section className="demo-section">
          <EscrowDemo />
        </section>

        {/* Live Testnet wallet */}
        <section className="wallet-section" id="wallet">
          <span className="kicker center">Live on Testnet</span>
          <h2 className="section-title">Try the real wallet</h2>
          <p className="section-sub">
            Connect Freighter (on Testnet), check your XLM balance, and send a real Testnet payment.
          </p>
          <StellarWalletPanel />
        </section>

        {/* Deployed contract */}
        <section className="contract">
          <div className="contract-card">
            <div>
              <span className="kicker">Deployed contract</span>
              <h3>Live on Stellar Testnet</h3>
              <code className="contract-id">{CONTRACT_ID}</code>
            </div>
            <a className="btn ghost" href={CONTRACT_URL} target="_blank" rel="noreferrer">
              View on Stellar Expert <IconExternal size={16} />
            </a>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>
          <IconShield size={16} /> COD Lock
        </span>
        <span className="foot-mid">Stellar Testnet only · Freighter signs every transaction · no real funds in demo mode</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
