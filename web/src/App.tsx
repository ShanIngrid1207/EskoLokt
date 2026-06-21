import { useState } from "react";
import { OrdersDashboard } from "./components/OrdersDashboard";
import { GuideView } from "./components/GuideView";
import { StellarWalletPanel } from "./components/StellarWalletPanel";
import { ContractPanel } from "./components/ContractPanel";
import { IconGrid, IconInfo, IconWallet, IconShield, IconBook } from "./components/icons";

type View = "orders" | "guide" | "wallet" | "contract";

const NAV: { id: View; label: string; icon: typeof IconGrid }[] = [
  { id: "orders", label: "Orders", icon: IconGrid },
  { id: "guide", label: "How it works", icon: IconInfo },
  { id: "wallet", label: "Wallet", icon: IconWallet },
  { id: "contract", label: "Proof", icon: IconShield },
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
  wallet: {
    title: "Wallet",
    sub: "Optional, for the curious. Send a test payment on Stellar's free test network — no real money is involved.",
  },
  contract: {
    title: "Proof it's real",
    sub: "The live program on Stellar that holds each order's refundable deposit and settles it automatically. You don't need to understand this part.",
  },
};

const REPO_URL = "https://github.com/ShanIngrid1207/CodLock";
const SITE_URL = "https://shaningrid1207.github.io/CodLock/";

export default function App() {
  const [view, setView] = useState<View>("orders");
  const meta = TITLES[view];

  return (
    <div className="shell">
      {/* Dark rail */}
      <nav className="rail" aria-label="Primary">
        <div className="rail-logo" title="Esko Lokt">
          <IconShield size={22} />
        </div>
        <span className="rail-brand">Esko Lokt</span>
        <div className="rail-items">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`rail-item ${view === item.id ? "active" : ""}`}
                onClick={() => setView(item.id)}
                aria-current={view === item.id ? "page" : undefined}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <a className="rail-item docs" href={REPO_URL} target="_blank" rel="noreferrer">
          <IconBook size={20} />
          <span>Docs</span>
        </a>
      </nav>

      {/* Content column */}
      <div className="content">
        {/* Top bar */}
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
            {view === "guide" && <GuideView />}
            {view === "wallet" && (
              <div className="centered-view">
                <StellarWalletPanel />
              </div>
            )}
            {view === "contract" && <ContractPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
