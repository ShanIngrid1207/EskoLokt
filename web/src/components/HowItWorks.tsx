import { IconBuyer, IconEscrow, IconCheck, IconRefund } from "./icons";

// Plain-language explainer that surfaces the trust model and answers the
// questions a buyer or seller (or a judge) actually asks. Content only — it
// mirrors the decisions captured in the trust-model design doc.

const STEPS = [
  {
    icon: IconBuyer,
    tone: "blue",
    title: "Customer pays up front",
    text: "At checkout the money goes straight into a neutral safe — not to the seller yet.",
  },
  {
    icon: IconEscrow,
    tone: "indigo",
    title: "Money is held safely",
    text: "Nobody can touch it — not the seller, not the customer, not even us — while the parcel is on the way.",
  },
  {
    icon: IconCheck,
    tone: "green",
    title: "Delivered → seller paid",
    text: "The customer enters their one-time code at the door. That releases the money to the seller.",
  },
  {
    icon: IconRefund,
    tone: "amber",
    title: "Problem → customer refunded",
    text: "If the parcel is returned, the refund is automatic. No arguing, no chasing.",
  },
];

const FAQ = [
  {
    q: "What if the item is bad or wrong?",
    a: "Within a short check period the customer can return it. Once the courier confirms it came back, the refund happens automatically — no one has to argue about who's right.",
  },
  {
    q: "Who decides the parcel was really delivered?",
    a: "The customer does — they give the rider a one-time code at the door. Without that code the money stays locked, so a seller can't fake a delivery.",
  },
  {
    q: "What if there's no internet?",
    a: "The customer can still pay safely at a nearby counter or by text message. See the Emergency tab.",
  },
  {
    q: "Where does the money sit — can Esko Lokt run off with it?",
    a: "No. No one holds your money, not even us. It sits in a neutral lock and can only move to the seller (delivered) or back to the customer (returned).",
  },
  {
    q: "Isn't this just GCash or Shopee?",
    a: "Those protect you only inside their own apps. Esko Lokt works on your own Facebook or Instagram page, and protects both the buyer and the seller.",
  },
  {
    q: "Do I need to understand crypto?",
    a: "No. You and your customer only ever see pesos. The technical part runs quietly in the background.",
  },
];

const BADGES = [
  "No one holds your money",
  "Automatic refunds",
  "Works offline",
  "No crypto needed",
  "Free to try",
];

export function HowItWorks() {
  return (
    <div className="how">
      <p className="how-lead">
        Esko Lokt makes buying and selling online safe for <strong>both sides</strong>. The moment your
        customer pays, the money is locked in a neutral safe — and it only moves on real events: it's
        released when they receive the parcel, or refunded if it comes back. No bank, no middleman, and
        no one can run off with it.
      </p>

      <div className="hiw-steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <article className="hiw-step" key={s.title}>
              <span className={`hiw-icon ${s.tone}`}>
                <Icon size={22} />
              </span>
              <span className="hiw-no">Step {i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          );
        })}
      </div>

      <section className="panel how-faq">
        <div className="panel-head">
          <span>Common worries, answered</span>
        </div>
        <dl>
          {FAQ.map((f) => (
            <div className="faq-item" key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="how-badges">
        {BADGES.map((b) => (
          <span className="how-badge" key={b}>
            <IconCheck size={14} /> {b}
          </span>
        ))}
      </div>

      <p className="how-note">
        Built first for higher-trust sales like gadgets and group buys / pre-orders — and made simple
        enough for everyday cash-on-delivery.
      </p>
    </div>
  );
}
