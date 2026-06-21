import { useState } from "react";
import { HowItWorks } from "./HowItWorks";
import { EscrowDemo } from "./EscrowDemo";
import { EmergencyOptions } from "./EmergencyOptions";

// Combines the three "understand the product" sections — the plain-language
// overview, the interactive demo, and the offline options — under one nav item
// with internal sub-tabs, so the rail stays short.

type Tab = "overview" | "demo" | "offline";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "demo", label: "Try it" },
  { id: "offline", label: "No signal" },
];

export function GuideView() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="guide">
      <div className="tabstrip" role="tablist" aria-label="How it works">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="view-fade" key={tab}>
        {tab === "overview" && <HowItWorks />}
        {tab === "demo" && (
          <div className="centered-view">
            <EscrowDemo />
          </div>
        )}
        {tab === "offline" && <EmergencyOptions />}
      </div>
    </div>
  );
}
