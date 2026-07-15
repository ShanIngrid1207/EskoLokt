// Stellar Testnet configuration. This app NEVER touches Mainnet.
export const STELLAR_NETWORK = "TESTNET" as const;
export const STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org";

// Friendbot funds brand-new Testnet accounts with test XLM.
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Build a Testnet explorer link for a transaction hash.
export const STELLAR_EXPLORER_TX = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

// Soroban (smart-contract) RPC endpoint for Testnet.
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

// The deployed EskoLokt deposit-escrow contract (Testnet). Overridable via env;
// the fallback is the deposit-model contract with the ON-CHAIN delivery-code hash,
// deployed 2026-07-15. Teammates must set the same VITE_CONTRACT_ID in their env.
// (Prior deposit contract w/o on-chain code check: CDRJK2QLAOGLIOSERJJ7GMXHVZPN7PVIY5VELKTNVS5DE7TKQDR5K7IT.
//  Pre-upgrade full-escrow contract: CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN.)
export const CONTRACT_ID =
  (import.meta.env.VITE_CONTRACT_ID as string) ||
  "CAVJDHDQZTVACI25P2HNDPTGOE6BGRKEHFN6ZA3WWSBDF7TT6CYDCVKA";

// Test USDC used for the refundable deposit. The issuer is filled in after the
// one-time asset setup (env); the token's SAC address is derived at runtime.
export const USDC_CODE = "USDC";
export const USDC_ISSUER = (import.meta.env.VITE_USDC_ISSUER as string) || "";

// Build a Testnet explorer link for a contract id.
export const STELLAR_EXPLORER_CONTRACT = (id: string) =>
  `https://stellar.expert/explorer/testnet/contract/${id}`;

// Pre-filled, editable defaults for the Live Testnet escrow demo.
// DEFAULT_SELLER receives the escrow on "release". Replace with your own
// second Testnet account if you prefer.
export const DEFAULT_SELLER = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
export const DEFAULT_AMOUNT_XLM = "1";
