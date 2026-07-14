import { useState } from "react";
import { IconStore, IconPhone, IconCheck, IconPin } from "./icons";

// Two offline fallbacks for areas with weak or no signal, in plain seller
// language. Cash is paid on delivery (true COD); these flows just confirm
// delivery and handle the small deposit. The text flow is a faithful simulated
// phone screen (a real version needs a telco / SMS gateway backend).

const AGENTS = [
  { name: "Aling Nena's Store", dist: "200 m", open: true },
  { name: "J&T Padala Center", dist: "1.2 km", open: true },
  { name: "Barangay 7 Hub", dist: "1.5 km", open: false },
];

export function EmergencyOptions() {
  return (
    <div className="emergency">
      <p className="emergency-intro">
        Weak signal or no load? Your customer still has two ways to pay safely — pick whatever works
        where they are.
      </p>
      <div className="emergency-grid">
        <CounterCard />
        <TextCard />
      </div>
    </div>
  );
}

/* ---------- Option 1: Pay on delivery (rider confirms) ---------- */
function CounterCard() {
  const [step, setStep] = useState<"idle" | "coded" | "confirmed">("idle");
  const [code, setCode] = useState("");

  const generate = () => {
    setCode(String(Math.floor(1000 + Math.random() * 9000)));
    setStep("coded");
  };

  return (
    <section className="panel opt-card">
      <div className="opt-head">
        <span className="opt-icon store">
          <IconStore size={22} />
        </span>
        <div>
          <h2>Pay on delivery</h2>
          <span className="opt-tag">Your customer needs no internet at all</span>
        </div>
      </div>

      <p className="opt-text">
        Your customer pays cash to the rider at the door — exactly like normal COD. The rider has
        signal, so entering the customer's delivery code settles everything on the spot. Nearby agents
        can also lock the small deposit for customers who can't do it online.
      </p>

      {step === "idle" && (
        <button className="btn primary" onClick={generate}>
          Generate delivery code
        </button>
      )}

      {step !== "idle" && (
        <div className="code-box">
          <span className="code-label">Customer shows this to the rider at the door</span>
          <span className="code-value">{code}</span>
        </div>
      )}

      {step === "coded" && (
        <button className="btn success" onClick={() => setStep("confirmed")}>
          <IconCheck size={18} /> Rider confirms delivery
        </button>
      )}

      {step === "confirmed" && (
        <p className="result success opt-result">
          <IconCheck size={18} /> Delivered — you got paid in cash, and the deposit went back to your
          customer.
        </p>
      )}

      <div className="agents">
        <span className="agents-title">Nearby agents</span>
        <ul>
          {AGENTS.map((a) => (
            <li key={a.name}>
              <span className="agent-name">
                <IconPin size={15} /> {a.name}
              </span>
              <span className="agent-meta">
                <span className="agent-dist">{a.dist}</span>
                <span className={`agent-open ${a.open ? "on" : "off"}`}>
                  {a.open ? "Open" : "Closed"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {step !== "idle" && (
        <button className="btn ghost sm reset-link" onClick={() => setStep("idle")}>
          Start over
        </button>
      )}
    </section>
  );
}

/* ---------- Option 2: Pay by Text (Full-size phone mockup) ---------- */
function TextCard() {
  // 0 = idle, 1 = dialed (menu shown), 2 = confirmed
  const [step, setStep] = useState(0);

  return (
    <section className="panel opt-card">
      <div className="opt-head">
        <span className="opt-icon phone">
          <IconPhone size={22} />
        </span>
        <div>
          <h2>Pay by text</h2>
          <span className="opt-tag">Works on any phone — no data, no app</span>
        </div>
      </div>

      <p className="opt-text">
        No signal for data but still has a text line? Your customer dials a short code to confirm
        delivery and get their deposit back — the same way GCash or M-Pesa work on basic phones.
      </p>

      {/* Full-size realistic phone screen mockup */}
      <div className="phone">
        <div className="phone-screen" aria-live="polite">
          {/* Top Notch & Status Bar */}
          <div className="phone-top-bar">
            <span className="phone-time">14:30</span>
            <div className="phone-notch" />
            <span className="phone-icons">LTE ▮▮▮</span>
          </div>

          {/* Phone Display Content */}
          <div className="phone-display-body">
            {step === 0 && (
              <div className="ussd">
                <p className="ussd-line dim">USSD Code / Phone Dialer</p>
                <p className="ussd-code">*123*456#</p>
                <p className="ussd-line dim" style={{ marginTop: 12 }}>
                  Dial shortcode to access Esko Lokt offline menu
                </p>
              </div>
            )}
            {step === 1 && (
              <div className="ussd">
                <p className="ussd-title">Esko Lokt USSD</p>
                <p className="ussd-line">Order COD-7F3K · ₱500</p>
                <div className="ussd-menu-divider" />
                <p className="ussd-line">1. Confirm delivery</p>
                <p className="ussd-line">2. Check order status</p>
                <p className="ussd-line">3. Report problem</p>
              </div>
            )}
            {step === 2 && (
              <div className="ussd">
                <p className="ussd-ok">✓ Delivery Confirmed</p>
                <p className="ussd-line">Your ₱50 deposit has been returned to your wallet.</p>
                <p className="ussd-line dim" style={{ marginTop: 8 }}>Ref: COD-7F3K</p>
              </div>
            )}
          </div>

          {/* Phone Actions inside / below display */}
          <div className="phone-actions">
            {step === 0 && (
              <button className="btn primary phone-btn" onClick={() => setStep(1)}>
                Dial *123*456#
              </button>
            )}
            {step === 1 && (
              <button className="btn success phone-btn" onClick={() => setStep(2)}>
                Reply “1” to confirm
              </button>
            )}
            {step === 2 && (
              <button className="btn ghost sm phone-btn" onClick={() => setStep(0)}>
                Start over
              </button>
            )}
          </div>

          {/* Bottom Home Indicator */}
          <div className="phone-home-bar" />
        </div>
      </div>

      <p className="opt-note">
        Preview of how it works. The live version connects to a telco / SMS gateway — a next-phase
        add-on.
      </p>
    </section>
  );
}
