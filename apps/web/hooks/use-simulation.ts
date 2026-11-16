import { useMemo } from "react";
import useComponents from "@/hooks/use-components";
import useDependencyAccounts from "@/hooks/use-dependency-accounts";
import { appendConsoleEntry } from "@/lib/console-log";
import type { ForeignAccountsStatus } from "@/lib/simulation/blocked";
import {
  simulatedAccountName,
  simulatedAccountValue,
} from "@/lib/simulation/foreign-accounts";
import {
  createSimulatedAccount,
  type SimulationResult,
  simulateProcedure,
  stageForeignAccount,
  storageChanges,
} from "@/lib/simulation/run";
import {
  initialStorageSlots,
  shownStorageSlots,
  simulatedAccount,
} from "@/lib/simulation/simulated-accounts";
import {
  enqueueSimulation,
  withSimulationClient,
} from "@/lib/simulation/simulation-client";
import { useSimulationStorageSlots } from "@/lib/simulation/simulation-state";
import type { Account } from "@/lib/types/account";
import type { ProcedureExport, Script } from "@/lib/types/script";
import {
  cleanExecutionError,
  encodeProcedureArguments,
  type ProcedureArguments,
  procedureParams,
} from "@/lib/utils/procedure-inputs";
import { formatProcedureExportPath } from "@/lib/utils/script";
import { effectiveStorageChanges } from "@/lib/utils/storage-slots";
import { accountIdParts } from "@/lib/web-client";

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
  const [slots, setStorageSlots] = useSimulationStorageSlots(
    script.id,
    useMemo(
      () => initialStorageSlots(script, components),
      [script, components],
    ),
  );
  const storageSlots = useMemo(
    () => shownStorageSlots(schema, slots),
    [schema, slots],
  );
  // The foreign accounts: one per `account-component` dependency whose
  // package the workspace or the web app holds.
  const {
    accounts: foreignAccounts,
    unresolved: unresolvedForeignAccounts,
    ready: foreignAccountsReady,
  } = useDependencyAccounts(script);
  const foreignAccountsStatus: ForeignAccountsStatus = {
    staged: foreignAccounts.length,
    stale: unresolvedForeignAccounts
      .filter(({ reason }) => reason === "stale")
      .map(({ name }) => name),
    missing: unresolvedForeignAccounts
      .filter(({ reason }) => reason === "missing")
      .map(({ name }) => name),
  };
  // What the `AccountId` arguments' dropdowns offer above the sandbox's
  // accounts.
  const simulatedAccounts = foreignAccounts.map(({ name }) => ({
    value: simulatedAccountValue(name),
    name,
  }));
  // Resolves to the run's result and the account's state it ran from.
  const invoke = (procedureExport: ProcedureExport, args: ProcedureArguments) =>
    enqueueSimulation(async () => {
      const name = formatProcedureExportPath(procedureExport.path);
      let account: Account | undefined;
      let result: SimulationResult;
      try {
        result = await withSimulationClient(async (client) => {
          // The foreign accounts first, each committed in a block of the
          // mock chain. Not for a procedure known not to call one, unless an
          // argument names one.
          const pickedForeign = Object.values(args).some(
            (argument) =>
              argument.type === "AccountId" &&
              simulatedAccountName(argument.accountId) !== undefined,
          );
          const staged = new Map<string, Account>();
          if (procedureExport.callsForeign !== false || pickedForeign) {
            for (const foreignAccount of foreignAccounts) {
              staged.set(
                foreignAccount.name,
                await simulatedAccount(
                  client,
                  `foreign:${foreignAccount.script.commitment}:${JSON.stringify(foreignAccount.storageSlots)}`,
                  () =>
                    stageForeignAccount({
                      client,
                      script: foreignAccount.script,
                      storageSlots: foreignAccount.storageSlots,
                    }),
                ),
              );
            }
          }
          // The stand-ins of the staged accounts, replaced by their ids.
          const resolvedArgs = Object.fromEntries(
            Object.entries(args).map(([name, argument]) => {
              const foreignName =
                argument.type === "AccountId"
                  ? simulatedAccountName(argument.accountId)
                  : undefined;
              if (foreignName === undefined) {
                return [name, argument];
              }
              const foreign = staged.get(foreignName);
              if (!foreign) {
                throw new Error(
                  `The simulated account ${foreignName} is no longer a dependency of this script: pick another account.`,
                );
              }
              return [name, { ...argument, accountId: foreign.id }];
            }),
          );
          account = await simulatedAccount(
            client,
            `${script.id}:${script.commitment}:${JSON.stringify(storageSlots)}`,
            () =>
              createSimulatedAccount({
                client,
                name: script.name,
                components: [{ script, storageSlots }],
              }),
          );
          return simulateProcedure({
            client,
            accountId: account.id,
            script,
            procedureExport,
            procedureInputs: encodeProcedureArguments({
              params: procedureParams(procedureExport),
              args: resolvedArgs,
              accountIdParts,
            }),
            foreignAccountsStaged: staged.size,
          });
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
  return {
    storageSlots,
    setStorageSlots,
    foreignAccounts,
    unresolvedForeignAccounts,
    foreignAccountsStatus,
    foreignAccountsReady,
    simulatedAccounts,
    invoke,
  };
};

export default useSimulation;
