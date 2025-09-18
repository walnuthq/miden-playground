export const networks = {
  mtst: "Testnet",
  mlcl: "Local",
} as const;

export type NetworkId = keyof typeof networks;
