import type { ProcedureExport } from "@/lib/types/script";

// Why the Simulate tab can't run an account component's procedure, if it
// can't. The mock client serves only the accounts of its own chain, and panics
// inside the WASM on any other id: a procedure that calls another account's
// procedure (FPI) runs only against an account staged from one of the
// script's dependencies (lib/simulation/foreign-accounts.ts). Only a
// `callsForeign` of `true` blocks, and only when nothing could be staged: a
// `null` (api-compile couldn't tell) or a missing flag runs as before.
// SDK-free, so the list and its tests can import it.
export const FOREIGN_CALL_REASON =
  "Calls a procedure of another account, and none of this script's dependencies is an account component a simulation can stage. Deploy the component and invoke it from the account's Components tab.";

export const staleForeignCallReason = (names: string[]) =>
  `Calls a procedure of another account, but ${names.join(", ")} changed since this script was compiled: compile this script again to simulate it.`;

export const missingForeignCallReason = (names: string[]) =>
  `Calls a procedure of another account, but the compiled package of ${names.join(", ")} isn't in the workspace: compile it, then this script.`;

// The script's foreign accounts: how many were staged, and the names of the
// dependencies that couldn't be.
export type ForeignAccountsStatus = {
  staged: number;
  stale?: string[];
  missing?: string[];
};

export const simulationBlockedReason = (
  { callsForeign }: Pick<ProcedureExport, "callsForeign">,
  { staged, stale = [], missing = [] }: ForeignAccountsStatus = { staged: 0 },
) => {
  if (callsForeign !== true || staged > 0) {
    return undefined;
  }
  if (stale.length > 0) {
    return staleForeignCallReason(stale);
  }
  if (missing.length > 0) {
    return missingForeignCallReason(missing);
  }
  return FOREIGN_CALL_REASON;
};
