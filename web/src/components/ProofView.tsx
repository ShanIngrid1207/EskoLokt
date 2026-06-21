import { ContractPanel } from "./ContractPanel";
import { StellarWalletPanel } from "./StellarWalletPanel";

// One "it's real" page: the live program (proof) as the main column, with the
// optional "try a real payment" wallet beside it. Reuses the guide two-column
// layout so the wide space is used instead of two separate tabs.

export function ProofView() {
  return (
    <div className="guide-layout">
      <div className="guide-main">
        <ContractPanel />
      </div>

      <aside className="guide-side">
        <div className="guide-block">
          <span className="guide-kicker">Try a real payment</span>
          <StellarWalletPanel />
        </div>
      </aside>
    </div>
  );
}
