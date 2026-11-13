import type { Script } from "@/lib/types/script";

// The account procedures a note or transaction script calls, by MAST root
// (`metadata.accountProcedures`), matched against accounts' code. No SDK here:
// the caller passes the check (`AccountCode.hasProcedure`).

const normalizeRoot = (root: string) =>
  `0x${root.replace(/^0x/i, "").toLowerCase()}`;

// The roots an account's code lacks, in the order given.
export const missingProcedures = (
  roots: string[],
  hasProcedure: (root: string) => boolean,
) => roots.filter((root) => !hasProcedure(root));

// A root's procedure name, from the first script that exports it: the last
// segment of the export path (`increment-count` for
// `::"miden:counter-account/counter-contract@0.1.0"::"increment-count"`).
// Pass the workspace's scripts and the built-ins. A shortened root otherwise.
export const procedureName = (root: string, scripts: Script[]) => {
  const normalized = normalizeRoot(root);
  for (const { procedureExports } of scripts) {
    const procedure = procedureExports.find(
      ({ digest }) => normalizeRoot(digest) === normalized,
    );
    const name = procedure?.path.split("::").at(-1)?.replaceAll('"', "");
    if (name) {
      return name;
    }
  }
  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
};
