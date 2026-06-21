import { HowItWorks } from "./HowItWorks";
import { EscrowDemo } from "./EscrowDemo";
import { EmergencyOptions } from "./EmergencyOptions";

// One "understand the product" page: the plain-language overview on the left,
// with the interactive demo and the offline options stacked on the right so the
// wide space is used instead of hidden behind tabs.

export function GuideView() {
  return (
    <div className="guide-layout">
      <div className="guide-main">
        <HowItWorks />
      </div>

      <aside className="guide-side">
        <div className="guide-block">
          <span className="guide-kicker">Try it yourself</span>
          <EscrowDemo />
        </div>
        <div className="guide-block">
          <span className="guide-kicker">No signal? No problem</span>
          <EmergencyOptions />
        </div>
      </aside>
    </div>
  );
}
