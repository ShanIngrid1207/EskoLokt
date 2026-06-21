import { useState } from "react";
import { IconStore, IconPhone, IconCheck, IconPin } from "./icons";

// Two offline fallbacks for areas with weak or no signal, written in plain
// seller language. The counter flow is a real working mini-flow; the text flow
// is a faithful simulated feature-phone screen (a real version needs a telco /
// SMS gateway backend — noted in the UI).

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `COD-${s}`;
}

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

/* ---------- Option 1: Pay at a Counter ---------- */
function CounterCard() {
  const [step, setStep] = useState<"idle" | "coded" | "confirmed">("idle");
  const [code, setCode] = useState("");

  const generate = () => {
    setCode(makeCode());
    setStep("coded");
  };

  return (
    <section className="panel opt-card">
      <div className="opt-head">
        <span className="opt-icon store">
          <IconStore size={22} />
        </span>
        <div>
          <h2>Pay at a counter</h2>
          <span className="opt-tag">No internet needed for the customer</span>
        </div>
      </div>

      <p className="opt-text">
        Your customer brings cash and an order code to a nearby Esko&nbsp;Lokt counter — a sari-sari
        store or padala agent. The agent locks the money safely for them, just like a remittance
        counter.
      </p>

      {step === "idle" && (
        <button className="btn primary" onClick={generate}>
          Generate an order code
        </button>
      )}

      {step !== "idle" && (
        <div className="code-box">
          <span className="code-label">Show this code + cash to the agent</span>
          <span className="code-value">{code}</span>
        </div>
      )}

      {step === "coded" && (
        <button className="btn success" onClick={() => setStep("confirmed")}>
          <IconCheck size={18} /> Agent confirms payment
        </button>
      )}

      {step === "confirmed" && (
        <p className="result success opt-result">
          <IconCheck size={18} /> Counter confirmed — the ₱500 is now <strong>Held safely</strong>{" "}
          until delivery.
        </p>
      )}

      <div className="agents">
        <span className="agents-title">Nearby counters</span>
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

/* ---------- Option 2: Pay by Text ---------- */
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
        No signal for data but still has a text line? Your customer dials a short code to confirm the
        order — the same way GCash or M-Pesa work on basic phones.
      </p>

      {/* Simulated feature-phone screen */}
      <div className="phone">
        <div className="phone-screen" aria-live="polite">
          {step === 0 && (
            <div className="ussd">
              <p className="ussd-line dim">Dial to confirm your order:</p>
              <p className="ussd-code">*123*456#</p>
            </div>
          )}
          {step === 1 && (
            <div className="ussd">
              <p className="ussd-title">Esko Lokt</p>
              <p className="ussd-line">Order COD-7F3K · ₱500</p>
              <p className="ussd-line">1. Confirm delivery</p>
              <p className="ussd-line">2. Check status</p>
              <p className="ussd-line">3. Report problem</p>
            </div>
          )}
          {step === 2 && (
            <div className="ussd">
              <p className="ussd-ok">✓ Confirmed</p>
              <p className="ussd-line">₱500 released to Joy's Closet.</p>
              <p className="ussd-line dim">Ref: COD-7F3K</p>
            </div>
          )}
        </div>
      </div>

      <div className="phone-actions">
        {step === 0 && (
          <button className="btn primary" onClick={() => setStep(1)}>
            Dial *123*456#
          </button>
        )}
        {step === 1 && (
          <button className="btn success" onClick={() => setStep(2)}>
            Reply “1” to confirm
          </button>
        )}
        {step === 2 && (
          <button className="btn ghost sm" onClick={() => setStep(0)}>
            Start over
          </button>
        )}
      </div>

      <p className="opt-note">
        Preview of how it works. The live version connects to a telco / SMS gateway — a next-phase
        add-on.
      </p>
    </section>
  );
}
