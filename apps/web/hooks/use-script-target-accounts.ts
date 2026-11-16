import { useMiden } from "@miden-sdk/react";
import { useEffect, useMemo, useState } from "react";
import useAccounts from "@/hooks/use-accounts";
import { enqueueSimulation } from "@/lib/simulation/simulation-client";
import type { Script } from "@/lib/types/script";
import { clientAccountMissingProcedures } from "@/lib/web-client";

export type ScriptTargetAccounts = {
  // `all`: no filter (the script calls no account procedure, or its package
  // doesn't say). `checking`: some accounts' code is still being read.
  status: "all" | "checking" | "filtered";
  // The accounts that can run the script, and those not checked yet when
  // `checking`. An account whose code couldn't be read is kept: it's unknown,
  // not incompatible.
  accountIds: Set<string>;
};

// The roots each code commitment lacks, by `${code}:${roots}`. The same code
// always has the same procedures, so syncs, storage changes and re-renders
// read nothing again.
const missingByCode = new Map<string, string[]>();

// The sandbox's accounts that can run a note or transaction script: those
// whose code has every account procedure the script calls
// (`metadata.accountProcedures`), checked on the app's client.
const useScriptTargetAccounts = (script: Script): ScriptTargetAccounts => {
  const { client } = useMiden();
  const { accounts } = useAccounts();
  const accountProcedures = script.metadata?.accountProcedures;
  const roots =
    Array.isArray(accountProcedures) && accountProcedures.length > 0
      ? accountProcedures
      : undefined;
  const rootsKey = roots?.join() ?? "";
  // Bumped when checks land, to read the cache again.
  const [checks, setChecks] = useState(0);
  // The cache keys whose account couldn't be read with this client.
  const [unknown, setUnknown] = useState(() => new Set<string>());
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new client can read what the last one couldn't.
  useEffect(() => setUnknown(new Set()), [client]);
  const cacheKey = (code: string, id: string) => `${code || id}:${rootsKey}`;
  const pending = roots
    ? accounts.filter(({ id, code }) => {
        const key = cacheKey(code, id);
        return !missingByCode.has(key) && !unknown.has(key);
      })
    : [];
  const pendingKey = pending.map(({ id, code }) => `${id}:${code}`).join();
  // biome-ignore lint/correctness/useExhaustiveDependencies: `pendingKey` stands for `pending`.
  useEffect(() => {
    if (!roots || pending.length === 0) {
      return;
    }
    let cancelled = false;
    // Queued with the simulations: they share the app's client.
    enqueueSimulation(async () => {
      const failed: string[] = [];
      for (const { id, code } of pending) {
        if (cancelled) {
          return;
        }
        const key = cacheKey(code, id);
        if (missingByCode.has(key)) {
          continue;
        }
        const missing = client
          ? await clientAccountMissingProcedures({
              client,
              accountId: id,
              roots,
            })
          : undefined;
        if (missing === undefined) {
          failed.push(key);
        } else {
          missingByCode.set(key, missing);
        }
      }
      if (!cancelled) {
        setUnknown((previous) => new Set([...previous, ...failed]));
        setChecks((previous) => previous + 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [client, rootsKey, pendingKey]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `checks` and `unknown` say when the cache changed.
  return useMemo(() => {
    if (!roots) {
      return {
        status: "all",
        accountIds: new Set(accounts.map(({ id }) => id)),
      };
    }
    const kept = accounts.filter(({ id, code }) => {
      const missing = missingByCode.get(cacheKey(code, id));
      return missing === undefined || missing.length === 0;
    });
    return {
      status: pending.length > 0 ? "checking" : "filtered",
      accountIds: new Set(kept.map(({ id }) => id)),
    };
  }, [accounts, rootsKey, pendingKey, checks, unknown]);
};

export default useScriptTargetAccounts;
