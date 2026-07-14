import { HowItWorks } from "./HowItWorks";
import { EscrowDemo } from "./EscrowDemo";
import { EmergencyOptions } from "./EmergencyOptions";

// Top row: Overview on the left, interactive EscrowDemo on the right.
// Bottom section: Emergency / offline options span full width below.
// This ensures balanced heights and prevents large empty spaces on either side.

export function GuideView() {
  return (
    <div className="guide-view-container">
      {/* Top Section: Overview (Left) + Interactive Demo (Right) */}
      <div className="guide-top-grid">
        <div className="guide-main-col">
          <HowItWorks />
        </div>

        <div className="guide-side-col">
          <div className="guide-block">
            <span className="guide-kicker">Try it yourself</span>
            <EscrowDemo />
          </div>
        </div>
      </div>

      {/* Bottom Section: Offline Options Full Width */}
      <div className="guide-bottom-section">
        <div className="guide-block">
          <span className="guide-kicker">No signal? No problem</span>
          <EmergencyOptions />
        </div>
      </div>
    </div>
  );
}
