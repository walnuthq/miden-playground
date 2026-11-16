import type { Script } from "../types/script.ts";
import { procedureName } from "../utils/account-procedures.ts";
import { SIMULATED_PREFIX } from "./foreign-accounts.ts";

// The simulated account a note or transaction script can run against: a
// throwaway account of the mock client holding the standard basic wallet, No
// Auth, and one component per `account-component` dependency of the script
// whose package resolves (`foreignDependencies`). No SDK import: the unit
// tests run on plain node.

// What the form holds when the simulated account is picked as the target (or
// named in an account field of the note's storage), and when the simulated
// asset is picked: the account's id changes with every storage edit, and the
// faucet's with every mock client. The run replaces them with the real ids.
export const SIMULATED_TARGET = `${SIMULATED_PREFIX}target`;
export const SIMULATED_ASSET = `${SIMULATED_PREFIX}asset`;

const normalizeRoot = (root: string) =>
  `0x${root.replace(/^0x/i, "").toLowerCase()}`;

// The account procedures the script calls (`metadata.accountProcedures`) that
// the simulated account lacks: none of its components (`components`, the
// resolved dependencies' packages, and `builtIns`, the standard basic wallet)
// exports them. Named after the first of `named` that exports them
// (`procedureName`). Empty when the package doesn't list them.
export const simulatedTargetMissing = ({
  script,
  components,
  builtIns,
  named,
}: {
  script: Pick<Script, "metadata">;
  components: Pick<Script, "procedureExports">[];
  builtIns: Pick<Script, "procedureExports">[];
  named: Script[];
}): string[] => {
  const accountProcedures = script.metadata?.accountProcedures;
  if (!Array.isArray(accountProcedures)) {
    return [];
  }
  const held = new Set(
    [...components, ...builtIns].flatMap(({ procedureExports }) =>
      procedureExports.map(({ digest }) => normalizeRoot(digest)),
    ),
  );
  return accountProcedures
    .filter((root) => !held.has(normalizeRoot(root)))
    .map((root) => procedureName(root, named));
};
