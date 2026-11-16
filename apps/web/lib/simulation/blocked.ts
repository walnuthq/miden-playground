import type { ProcedureExport } from "@/lib/types/script";

// Why the Simulate tab can't run an account component's procedure, if it
// can't. The mock client serves only the accounts of its own chain, and panics
// inside the WASM on any other id: a procedure that calls another account's
// procedure (FPI) can't run there. Only a `callsForeign` of `true` blocks: a
// `null` (api-compile couldn't tell) or a missing flag runs as before.
// SDK-free, so the list and its tests can import it.
export const FOREIGN_CALL_REASON =
  "Calls a procedure of another account, which a simulation can't reach. Deploy the component and invoke it from the account's Components tab.";

export const simulationBlockedReason = ({
  callsForeign,
}: Pick<ProcedureExport, "callsForeign">) =>
  callsForeign === true ? FOREIGN_CALL_REASON : undefined;
