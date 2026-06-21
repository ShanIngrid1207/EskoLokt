import { useState } from "react";
import { OrdersDashboard } from "./components/OrdersDashboard";
import { EscrowDemo } from "./components/EscrowDemo";
import { StellarWalletPanel } from "./components/StellarWalletPanel";
import { ContractPanel } from "./components/ContractPanel";
import {
  IconGrid,
  IconPlay,
  IconWallet,
  IconShield,
  IconBook,
} from "./components/icons";

type View = "orders" | "demo" | "wallet" | "contract";

const NAV: { id: View; label: string; icon: typeof IconGrid }[] = [
  { id: "orders", label: "Orders", icon: IconGrid },
  { id: "demo", label: "Demo", icon: IconPlay },
  { id: "wallet", label: "Wallet", icon: IconWallet },
  { id: "contract", label: "Contract", icon: IconShield },
];

const TITLES: Record<View, { title: string; sub: string }> = {
  orders: { title: "Escrow Orders", sub: "Every cash-on-delivery order held by the contract." },
  demo: { title: "Live Demo", sub: "Walk the escrow flow end to end — simulated, no funds needed." },
  wallet: { title: "Testnet Wallet", sub: "Connect Freighter, check your balance, send a payment." },
  contract: { title: "Contract", sub: "The deployed Soroban escrow on Stellar Testnet." },
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
        <div className="rail-logo" title="COD Lock">
          <IconShield size={22} />
        </div>
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
            <span className="crumb proj">CodLock</span>
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
          <div className="page-head">
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>

          {view === "orders" && <OrdersDashboard />}
          {view === "demo" && (
            <div className="centered-view">
              <EscrowDemo />
            </div>
          )}
          {view === "wallet" && (
            <div className="centered-view">
              <StellarWalletPanel />
            </div>
          )}
          {view === "contract" && <ContractPanel />}
        </main>
      </div>
    </div>
  );
}
