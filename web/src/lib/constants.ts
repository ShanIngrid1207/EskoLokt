// Stellar Testnet configuration. This app NEVER touches Mainnet.
export const STELLAR_NETWORK = "TESTNET" as const;
export const STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org";

// Friendbot funds brand-new Testnet accounts with test XLM.
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Build a Testnet explorer link for a transaction hash.
export const STELLAR_EXPLORER_TX = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;
