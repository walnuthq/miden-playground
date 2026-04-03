import type { Dependency } from "@/lib/types";

export const basicWalletDependency: Dependency = {
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account",
  digest: "0x91b7426f61f0b17d409919f19c69131a7f658c430df38168b87b082b6ff209c2",
};

export const defaultDependenciesRecords = {
  "basic-wallet": basicWalletDependency,
} as const;

export type DefaultDependency = keyof typeof defaultDependenciesRecords;
