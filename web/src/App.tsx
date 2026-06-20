import { StellarWalletPanel } from "./components/StellarWalletPanel";

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <h1>COD Lock</h1>
        <p>
          Stellar <strong>Testnet</strong> wallet — connect Freighter, check your XLM balance, and
          send a Testnet payment.
        </p>
      </header>

      <StellarWalletPanel />

      <footer className="foot">Stellar Testnet only · No Mainnet · Freighter signs every transaction.</footer>
    </main>
  );
}
