// Multi-wallet layer built on StellarWalletsKit. Replaces the single-wallet
// Freighter wrappers app-wide: connecting opens a modal listing every supported
// wallet (Freighter, Albedo, xBull, Rabet, Lobstr, Hana, …) on Testnet.
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit";
import {
  WalletConnectModule,
  WalletConnectAllowedMethods,
} from "@creit.tech/stellar-wallets-kit/modules/walletconnect.module";
import {
  STELLAR_NETWORK_PASSPHRASE,
  WALLETCONNECT_PROJECT_ID,
  APP_NAME,
  APP_DESCRIPTION,
} from "./constants";

const STORAGE_KEY = "eskolokt.wallet.id";

let kit: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (!kit) {
    const modules = [...allowAllModules()];
    // Add WalletConnect only when a projectId is configured — the module throws
    // on init without one. This is what lets mobile wallets connect by QR code.
    if (WALLETCONNECT_PROJECT_ID) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://codlock.app";
      modules.push(
        new WalletConnectModule({
          projectId: WALLETCONNECT_PROJECT_ID,
          name: APP_NAME,
          description: APP_DESCRIPTION,
          url: origin,
          icons: [`${origin}/icon-192.png`],
          // We build the XDR and submit to Horizon ourselves, so we only need the
          // wallet to sign (stellar_signXDR), not sign-and-submit.
          method: WalletConnectAllowedMethods.SIGN,
          network: WalletNetwork.TESTNET,
        }),
      );
    }
    kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      modules,
    });
  }
  return kit;
}

/** Open the wallet-selection modal; resolve with the chosen public key. */
export function openWalletPicker(): Promise<string> {
  const k = getKit();
  return new Promise((resolve, reject) => {
    k.openModal({
      onWalletSelected: async (option) => {
        try {
          k.setWallet(option.id);
          const { address } = await k.getAddress();
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, option.id);
          }
          if (!address) throw new Error("Wallet returned no address.");
          resolve(address);
        } catch (e) {
          reject(e);
        }
      },
      onClosed: () => reject(new Error("No wallet selected.")),
    });
  });
}

/** Read the current wallet address without prompting (null if none). */
export async function getKitAddress(): Promise<string | null> {
  try {
    const { address } = await getKit().getAddress();
    return address || null;
  } catch {
    return null;
  }
}

/** Ask the connected wallet to sign an XDR on Testnet; returns signed XDR. */
export async function signWithKit(xdr: string, address: string): Promise<string> {
  const { signedTxXdr } = await getKit().signTransaction(xdr, {
    address,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  });
  return signedTxXdr;
}

/** The wallet id chosen in a previous session, if any. */
export function restoreWalletId(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
}

/** Re-select a previously chosen wallet without opening the modal. */
export function setKitWallet(id: string): void {
  getKit().setWallet(id);
}
