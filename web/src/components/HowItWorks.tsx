import { IconBuyer, IconEscrow, IconCheck, IconRefund } from "./icons";

// Plain-language explainer that surfaces the trust model and answers the
// questions a buyer or seller (or a judge) actually asks. Content only — it
// mirrors the decisions captured in the trust-model design doc.

const STEPS = [
  {
    icon: IconBuyer,
    tone: "blue",
    title: "Customer locks a small deposit",
    text: "At checkout the customer locks a small, refundable deposit — not the full price. They'll pay cash when the parcel arrives.",
  },
  {
    icon: IconEscrow,
    tone: "indigo",
    title: "Deposit held safely",
    text: "Only that small deposit sits in a neutral safe while the parcel is on the way. Nobody can touch it — not the seller, not the customer, not even us.",
  },
  {
    icon: IconCheck,
    tone: "green",
    title: "Delivered → deposit returned",
    text: "The customer pays cash at the door and gives the rider a one-time code. That confirms delivery and returns their deposit.",
  },
  {
    icon: IconRefund,
    tone: "amber",
    title: "No-show → covers your shipping",
    text: "If the customer refuses or never shows, the deposit goes to the seller — so a fake order can't leave you paying for shipping.",
  },
];

const FAQ = [
  {
    q: "What if the item is bad or wrong?",
    a: "Because it's cash on delivery, your customer inspects the parcel at the door before handing over any cash. If it's wrong, they simply don't pay — and an honest no-accept returns the deposit too.",
  },
  {
    q: "Who decides the parcel was really delivered?",
    a: "The customer does — they give the rider a one-time code at the door. Without that code the deposit can't be settled, so a seller can't fake a delivery.",
  },
  {
    q: "What if there's no internet?",
    a: "The customer pays cash to the rider as usual — no signal needed. Confirming delivery and the deposit can also be done at a nearby agent or by text. See the Emergency tab.",
  },
  {
    q: "Where does the money sit — can Esko Lokt run off with it?",
    a: "No. The cash for the goods is paid hand-to-hand on delivery — it never touches us. Only the small deposit sits in a neutral lock, and it can only go back to the customer (delivered) or to the seller (refused).",
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
  "Pay cash on delivery",
  "No one holds your money",
  "Deposit auto-returns",
  "Works offline",
  "No crypto needed",
];

export function HowItWorks() {
  return (
    <div className="how">
      <p className="how-lead">
        Esko Lokt makes buying and selling online safe for <strong>both sides</strong> — without
        changing how cash-on-delivery already works. Your customer still pays cash when the parcel
        arrives. They just lock a small <strong>refundable deposit</strong> first, so a fake order can
        never leave you paying for shipping. No bank, no middleman, and no one can run off with it.
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
