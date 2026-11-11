import type { Multisig } from "@openzeppelin/miden-multisig-client";
import type { initMultisigClient } from "@/lib/multisig-client";

// The multisig client and the multisigs loaded with it, shared by every
// useMultisig() caller. One scope at a time: a workspace, a network and a
// signer. Entering another scope terminates the previous client, whose store
// was replaced or belongs to another chain.
export type MultisigClientResult = Awaited<
  ReturnType<typeof initMultisigClient>
>;
type Created = {
  midenClient: { terminate: () => void };
  result: MultisigClientResult;
};
type Scope = {
  key: string;
  // The Miden client is only known once creation resolves, so the scope keeps
  // the promise and terminates through it.
  created: Promise<Created>;
  multisigs: Map<string, Multisig>;
};

let scope: Scope | null = null;

const terminateScope = (previous: Scope) => {
  previous.created
    .then(({ midenClient }) => midenClient.terminate())
    .catch((error) => {
      console.error("Failed to terminate the previous multisig client", error);
    });
};

export const multisigScope = (
  key: string,
  create: () => Promise<Created>,
): Promise<MultisigClientResult> => {
  if (scope?.key !== key) {
    if (scope) {
      terminateScope(scope);
    }
    const created = create();
    const next: Scope = { key, created, multisigs: new Map() };
    scope = next;
    created.catch(() => {
      if (scope === next) {
        scope = null;
      }
    });
  }
  return (scope as Scope).created.then(({ result }) => result);
};

export const cachedMultisig = (key: string, accountId: string) =>
  scope?.key === key ? scope.multisigs.get(accountId) : undefined;

export const cacheMultisig = (
  key: string,
  accountId: string,
  multisig: Multisig,
) => {
  if (scope?.key === key) {
    scope.multisigs.set(accountId, multisig);
  }
};
