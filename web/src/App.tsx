import { useState } from "react";
import { OrdersDashboard } from "./components/OrdersDashboard";
import { GuideView } from "./components/GuideView";
import { ProofView } from "./components/ProofView";
import { LiveEscrowPanel } from "./components/LiveEscrowPanel";
import {
  LayoutGrid,
  HelpCircle,
  ShieldCheck,
  Zap,
  BookOpen,
  HelpingHand,
} from "lucide-react";

type View = "orders" | "guide" | "proof" | "live";

const MAIN_NAV: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: "orders", label: "Orders",       Icon: LayoutGrid  },
  { id: "guide",  label: "How it works", Icon: HelpCircle  },
  { id: "proof",  label: "Proof",        Icon: ShieldCheck },
  { id: "live",   label: "Live",         Icon: Zap         },
];

const TITLES: Record<View, { title: string; sub: string }> = {
  orders: {
    title: "Orders",
    sub: "Customers pay cash on delivery and lock a small refundable deposit — so a fake order never leaves you paying for shipping.",
  },
  guide: {
    title: "How it works",
    sub: "See how Esko Lokt protects every sale — read the overview, try a sample order, or check the offline options.",
  },
  proof: {
    title: "Proof it's real",
    sub: "The live program on Stellar that settles every sale automatically. If you're curious, you can also try a real payment yourself — no real money involved.",
  },
  live: {
    title: "Live on Testnet",
    sub: "Run the real escrow contract yourself with free practice XLM — lock a deposit, read it back from the chain, and release it, with a verifiable transaction each step.",
  },
};

const REPO_URL = "https://github.com/ShanIngrid1207/EskoLokt";
const SITE_URL = "https://shaningrid1207.github.io/EskoLokt/";

export default function App() {
  const [view, setView] = useState<View>("orders");
  const meta = TITLES[view];

  return (
    <div className="shell">
      {/* ── Sidebar (Efferd-style: wide, icon+text inline, section labels) ── */}
      <nav className="rail" aria-label="Primary">

        {/* Logo + brand row */}
        <div className="rail-brand-row">
          <div className="rail-logo" title="Esko Lokt">
            <ShieldCheck size={18} />
          </div>
          <span className="rail-brand">Esko Lokt</span>
        </div>

        {/* Product section */}
        <span className="rail-section">Product</span>
        <div className="rail-items">
          {MAIN_NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`rail-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Bottom: docs & help */}
        <div className="rail-bottom">
          <span className="rail-section">Resources</span>
          <a
            className="rail-item"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={16} />
            <span>Documentation</span>
          </a>
          <a
            className="rail-item"
            href={`${REPO_URL}/issues`}
            target="_blank"
            rel="noreferrer"
          >
            <HelpingHand size={16} />
            <span>Help Center</span>
          </a>
        </div>
      </nav>

      {/* ── Content column ── */}
      <div className="content">
        <header className="topbar">
          <div className="crumbs">
            <span className="crumb org">ShanIngrid1207</span>
            <span className="sep">/</span>
            <span className="crumb proj">esko-lokt</span>
          </div>
          <div className="topbar-right">
            <a className="top-link" href={SITE_URL} target="_blank" rel="noreferrer">
              {SITE_URL.replace("https://", "")}
            </a>
            <span className="net-pill">
              <span className="net-dot" /> Testnet
            </span>
          </div>
        </header>

        <main className="page">
          <div className="view-fade" key={view}>
            <div className="page-head">
              <h1>{meta.title}</h1>
              <p>{meta.sub}</p>
            </div>

            {view === "orders" && <OrdersDashboard />}
            {view === "guide"  && <GuideView />}
            {view === "proof"  && <ProofView />}
            {view === "live"   && <LiveEscrowPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
