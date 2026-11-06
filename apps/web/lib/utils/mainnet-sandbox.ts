import type { WorkspaceStarter } from "@/lib/types/state";
import { counterExampleStarter } from "@/lib/utils/counter-example";

// A new Mainnet sandbox starts with the counter-contract example's packages
// (counter-account and increment-note), so there's something to deploy: a
// network counter that increment-note, sent as a network note from Bread
// Wallet, increments. Partner Mainnet only creates invited accounts and
// network accounts, so no account comes with them.
export const mainnetSandboxStarter = (): Promise<WorkspaceStarter> =>
  // The built-in MASM counter is already "Counter Contract".
  counterExampleStarter({ componentName: "Counter Account" });
