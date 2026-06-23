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

// The deployed CodLock escrow contract (Testnet). Do not redeploy.
export const CONTRACT_ID = "CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";

// Build a Testnet explorer link for a contract id.
export const STELLAR_EXPLORER_CONTRACT = (id: string) =>
  `https://stellar.expert/explorer/testnet/contract/${id}`;

// Pre-filled, editable defaults for the Live Testnet escrow demo.
// DEFAULT_SELLER receives the escrow on "release". Replace with your own
// second Testnet account if you prefer.
export const DEFAULT_SELLER = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
export const DEFAULT_AMOUNT_XLM = "1";
