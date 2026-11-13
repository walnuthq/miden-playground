import { useMemo } from "react";
import useComponents from "@/hooks/use-components";
import { appendConsoleEntry } from "@/lib/console-log";
import {
  createSimulatedAccount,
  type SimulationResult,
  simulateProcedure,
  storageChanges,
} from "@/lib/simulation/run";
import {
  enqueueSimulation,
  simulationClient,
} from "@/lib/simulation/simulation-client";
import { useSimulationStorageSlots } from "@/lib/simulation/simulation-state";
import type { Account } from "@/lib/types/account";
import type { StorageSlot } from "@/lib/types/component";
import type { ProcedureExport, Script } from "@/lib/types/script";
import {
  cleanExecutionError,
  encodeProcedureArguments,
  type ProcedureArguments,
  procedureParams,
} from "@/lib/utils/procedure-inputs";
import { formatProcedureExportPath } from "@/lib/utils/script";
import {
  mergeStorageSlots,
  schemaStorageSlots,
} from "@/lib/utils/storage-schema";
import { effectiveStorageChanges } from "@/lib/utils/storage-slots";
import { accountIdParts } from "@/lib/web-client";

const NO_SLOTS: StorageSlot[] = [];

// The simulated accounts of this page load, by package and storage: an
// account's id depends on its storage, so each edit is a new one.
const simulatedAccounts = new Map<string, Promise<Account>>();

const simulatedAccount = (
  key: string,
  create: () => Promise<Account>,
): Promise<Account> => {
  const existing = simulatedAccounts.get(key);
  if (existing) {
    return existing;
  }
  const created = create();
  simulatedAccounts.set(key, created);
  created.catch(() => simulatedAccounts.delete(key));
  return created;
};

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

// The console's line for a run.
const summary = (
  name: string,
  result: SimulationResult & { ok: true },
  account: Account,
) => {
  const changes =
    result.executedTransaction &&
    effectiveStorageChanges(
      account.storage,
      storageChanges(result.executedTransaction),
    );
  const count = changes ? changes.values.length + changes.entries.length : 0;
  const parts = [
    result.value && `returned ${result.value}`,
    changes &&
      (count === 0 ? "no storage change" : plural(count, "storage change")),
  ].filter(Boolean);
  return `Simulated ${name}${parts.length > 0 ? `: ${parts.join(", ")}` : ""}.`;
};

// Simulates an account component's procedures on a throwaway account of the
// mock client, built from the script's package and the storage slots shown.
// Every run starts from those slots, at nonce 0: nothing is persisted.
const useSimulation = (script: Script) => {
  const { components } = useComponents();
  const schema = script.metadata?.storage;
  // The slots of the package's storage schema, at their defaults. Without one
  // (a package compiled before the API returned it), the slots of a component
  // of the workspace made from the script. Then the user's edits.
  const [slots, setStorageSlots] = useSimulationStorageSlots(
    script.id,
    useMemo(
      () =>
        schema
          ? schemaStorageSlots(schema)
          : (components.find(({ scriptId }) => scriptId === script.id)
              ?.storageSlots ?? NO_SLOTS),
      [schema, components, script.id],
    ),
  );
  // A recompile can change the schema: the edits of the slots it still has
  // stay, the others go.
  const storageSlots = useMemo(
    () => (schema ? mergeStorageSlots(schema, slots) : slots),
    [schema, slots],
  );
  // Resolves to the run's result and the account's state it ran from.
  const invoke = (procedureExport: ProcedureExport, args: ProcedureArguments) =>
    enqueueSimulation(async () => {
      const name = formatProcedureExportPath(procedureExport.path);
      let account: Account | undefined;
      let result: SimulationResult;
      try {
        const client = await simulationClient();
        account = await simulatedAccount(
          `${script.id}:${script.commitment}:${JSON.stringify(storageSlots)}`,
          () => createSimulatedAccount({ client, script, storageSlots }),
        );
        result = await simulateProcedure({
          client,
          accountId: account.id,
          script,
          procedureExport,
          procedureInputs: encodeProcedureArguments({
            params: procedureParams(procedureExport),
            args,
            accountIdParts,
          }),
        });
      } catch (error) {
        result = {
          ok: false,
          error: cleanExecutionError(
            error instanceof Error ? error.message : String(error),
          ),
        };
      }
      appendConsoleEntry(
        script.id,
        result.ok && account
          ? { level: "success", text: summary(name, result, account) }
          : {
              level: "error",
              text: `Simulation of ${name} failed.`,
              output: result.ok ? "" : result.error,
            },
      );
      return { result, account };
    });
  return { storageSlots, setStorageSlots, invoke };
};

export default useSimulation;
