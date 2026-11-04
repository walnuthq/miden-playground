export const networks = {
  mm: "Mainnet",
  mtst: "Testnet",
  mdev: "Devnet",
  mlcl: "Local",
  mmck: "MockChain",
} as const;

export type NetworkId = keyof typeof networks;
