// The app's wallet seam. Everything imports this WalletAdapter — never the kit
// directly — so a passkey smart-wallet implementation can drop in for mainnet
// with no UI change. Today it wraps the existing StellarWalletsKit layer.
import {
  openWalletPicker,
  getKitAddress,
  signWithKit,
  restoreWalletId,
  setKitWallet,
} from "./walletKit";

export interface WalletAdapter {
  /** Open the wallet picker and connect; resolves to the public key. */
  connect(): Promise<string>;
  /** Current connected public key, or null. Synchronous (cached). */
  getAddress(): string | null;
  /** Ask the connected wallet to sign an XDR; resolves to signed XDR. */
  signTransaction(xdr: string): Promise<string>;
  /** Forget the current connection. */
  disconnect(): Promise<void>;
}

let currentAddress: string | null = null;

// Best-effort: re-select a previously chosen wallet and cache its address so a
// returning user appears connected without re-opening the modal.
const savedId = restoreWalletId();
if (savedId) {
  setKitWallet(savedId);
  void getKitAddress().then((a) => {
    if (a) currentAddress = a;
  });
}

export const wallet: WalletAdapter = {
  async connect() {
    const address = await openWalletPicker();
    currentAddress = address;
    return address;
  },
  getAddress() {
    return currentAddress;
  },
  async signTransaction(xdr) {
    if (!currentAddress) throw new Error("No wallet connected.");
    return signWithKit(xdr, currentAddress);
  },
  async disconnect() {
    currentAddress = null;
  },
};
