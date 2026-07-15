import { useState, useEffect } from "react";
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
  Sun,
  Moon,
  Send,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type View = "orders" | "guide" | "proof" | "live";

const MAIN_NAV: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: "orders", label: "Dashboard",    Icon: LayoutGrid  },
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
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("esko-theme") as "light" | "dark") || "light";
  });

  // Apply theme to <html> so CSS [data-theme="dark"] selectors work globally
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("esko-theme", theme);
  }, [theme]);

  const meta = TITLES[view];
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <div className={`shell ${collapsed ? "rail-collapsed" : ""}`}>
      {/* Collapse / expand button — outside rail to avoid overflow:hidden clipping */}
      <button
        className="rail-collapse-btn"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* ── Sidebar (Efferd-style) ────────────────────────────────────────── */}
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
              title={label}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Bottom: changelog + links */}
        <div className="rail-bottom">
          {/* Changelog widget — Efferd-style */}
          <div className="rail-changelog">
            <div className="rail-changelog-label">Changelog</div>
            <div className="rail-changelog-title">Product update</div>
            <div className="rail-changelog-body">
              Stellar escrow + COD deposit flow now live on Testnet.
            </div>
            <a
              className="rail-changelog-link"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              Learn more
            </a>
          </div>

          <span className="rail-section">Resources</span>
          <a
            className="rail-item"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            title="Documentation"
          >
            <BookOpen size={16} />
            <span>Documentation</span>
          </a>
          <a
            className="rail-item"
            href={`${REPO_URL}/issues`}
            target="_blank"
            rel="noreferrer"
            title="Help Center"
          >
            <HelpingHand size={16} />
            <span>Help Center</span>
          </a>
        </div>
      </nav>

      {/* ── Content column ────────────────────────────────────────────────── */}
      <div className="content">
        <header className="topbar">
          {/* Breadcrumb: grid icon + current view title */}
          <div className="topbar-breadcrumb">
            <LayoutGrid size={16} className="topbar-breadcrumb-icon" />
            <span>{meta.title}</span>
          </div>

          {/* Right side: site link, network badge, icon buttons */}
          <div className="topbar-right">
            <a className="top-link" href={SITE_URL} target="_blank" rel="noreferrer">
              {SITE_URL.replace("https://", "")}
            </a>
            <span className="net-pill">
              <span className="net-dot" /> Testnet
            </span>
            <button
              className="topbar-icon-btn"
              aria-label="Send"
              title="Send"
            >
              <Send size={15} />
            </button>
            <button
              className="topbar-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={15} />
            </button>
            {/* Light / dark mode toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            {/* Avatar */}
            <div className="topbar-avatar" title="User account">
              EL
            </div>
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
