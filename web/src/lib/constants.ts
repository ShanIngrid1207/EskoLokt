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

// The deployed EskoLokt escrow contract (Testnet). Overridable via env so the
// redeployed deposit-model contract can be pointed at with no code change; the
// fallback is the current (pre-upgrade) contract id.
export const CONTRACT_ID =
  (import.meta.env.VITE_CONTRACT_ID as string) ||
  "CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";

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
