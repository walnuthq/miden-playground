import type { Dependency, Script } from "../types/script.ts";

// The accounts a simulation stages on the mock chain for the foreign calls of
// an account component's procedures: one per `account-component` dependency
// of the script whose compiled package can be found. No SDK import: the unit
// tests run on plain node.

export type ForeignDependency =
  | { dependency: Dependency; script: Script }
  // `stale`: the workspace's script of that id was recompiled since this
  // script was, so its procedure roots aren't the ones this script calls.
  // `missing`: no package with that commitment.
  | { dependency: Dependency; reason: "stale" | "missing" };

const hasPackage = (script: Script) => script.masp !== "";

// Resolves each `account-component` dependency to the package the script was
// compiled against (its `commitment`): a workspace script of the same id, else
// any workspace script, else a package the web app embeds. `embedded` is
// passed in so the tests don't load the embedded packages.
export const foreignDependencies = (
  script: Pick<Script, "dependencies">,
  scripts: Script[],
  embedded: Script[],
): ForeignDependency[] =>
  script.dependencies
    .filter(({ type }) => type === "account-component")
    .map((dependency) => {
      const sameCommitment = ({ commitment }: Script) =>
        commitment === dependency.commitment;
      const resolved =
        scripts.find(
          (candidate) =>
            candidate.id === dependency.id &&
            sameCommitment(candidate) &&
            hasPackage(candidate),
        ) ??
        scripts.find(
          (candidate) => sameCommitment(candidate) && hasPackage(candidate),
        ) ??
        embedded.find(sameCommitment);
      if (resolved) {
        return { dependency, script: resolved };
      }
      const stale = scripts.some(({ id }) => id === dependency.id);
      return { dependency, reason: stale ? "stale" : "missing" };
    });

// What an `AccountId` argument holds when a staged account is picked: its
// real id changes with every storage edit, so the form holds a stand-in that
// the run replaces with the id of the account it staged.
export const SIMULATED_PREFIX = "simulated:";

export const simulatedAccountValue = (name: string) =>
  `${SIMULATED_PREFIX}${name}`;

// The dependency's name, when the value is a staged account's stand-in. A
// package's name has no colon: a simulated asset's stand-in
// (`simulated:asset:<symbol>`, lib/simulation/simulated-assets.ts) isn't one.
export const simulatedAccountName = (value: string) => {
  const name = value.startsWith(SIMULATED_PREFIX)
    ? value.slice(SIMULATED_PREFIX.length)
    : undefined;
  return name?.includes(":") ? undefined : name;
};
