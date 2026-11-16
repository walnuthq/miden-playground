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

// A read-only script can't be compiled: its reasons stop at the cause.
export const staleForeignCallReason = (names: string[], readOnly = false) =>
  `Calls a procedure of another account, but ${names.join(", ")} changed since this script was compiled${readOnly ? "." : ": compile this script again to simulate it."}`;

export const missingForeignCallReason = (names: string[], readOnly = false) =>
  `Calls a procedure of another account, but the compiled package of ${names.join(", ")} isn't in the workspace${readOnly ? "." : ": compile it, then this script."}`;

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
  readOnly = false,
) => {
  if (callsForeign !== true || staged > 0) {
    return undefined;
  }
  if (stale.length > 0) {
    return staleForeignCallReason(stale, readOnly);
  }
  if (missing.length > 0) {
    return missingForeignCallReason(missing, readOnly);
  }
  return FOREIGN_CALL_REASON;
};

// Why an `AccountId` argument of the Simulate tab can't take a sandbox
// account, if it can't. A procedure known to make a foreign call runs on the
// mock chain, which serves only the accounts staged on it: a sandbox account
// makes its RPC panic. Only a `callsForeign` of `true`: with `false` the
// argument is plain data, and with `null` or a missing flag (api-compile
// couldn't tell) the client's crash recovery is the safety net. Every
// `AccountId` argument of such a procedure is restricted: the manifest
// doesn't say which one is the foreign account.
export const SANDBOX_FOREIGN_ACCOUNT_REASON =
  "A simulated foreign call can only reach the simulated accounts: sandbox accounts aren't on the simulation's chain.";

export const sandboxAccountsDisabledReason = ({
  callsForeign,
}: Pick<ProcedureExport, "callsForeign">) =>
  callsForeign === true ? SANDBOX_FOREIGN_ACCOUNT_REASON : undefined;
