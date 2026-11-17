import { useMemo } from "react";
import type { FaucetLabel } from "@/components/lib/fungible-assets-table";
import useComponents from "@/hooks/use-components";
import useDependencyAccounts from "@/hooks/use-dependency-accounts";
import { appendConsoleEntry } from "@/lib/console-log";
import type { ForeignAccountsStatus } from "@/lib/simulation/blocked";
import {
  simulatedAccountName,
  simulatedAccountValue,
} from "@/lib/simulation/foreign-accounts";
import {
  changedAssets,
  createSimulatedAccount,
  mockFaucetIds,
  mockFaucetLabels,
  type SimulationResult,
  simulateProcedure,
  stageForeignAccount,
  storageChanges,
  vaultBalances,
} from "@/lib/simulation/run";
import {
  initialStorageSlots,
  shownStorageSlots,
  simulatedAccount,
} from "@/lib/simulation/simulated-accounts";
import {
  type AssetRow,
  resolveSimulatedAsset,
  rowAssets,
  simulatedAssetOptions,
  usedSymbols,
  vaultChanges,
} from "@/lib/simulation/simulated-assets";
import {
  enqueueSimulation,
  withSimulationClient,
} from "@/lib/simulation/simulation-client";
import {
  useSimulatedAssetSymbols,
  useSimulationStorageSlots,
  useSimulationVault,
} from "@/lib/simulation/simulation-state";
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

// A run's result, the account's state it ran from, the labels of the
// simulated assets' faucets (the app doesn't know them), and the final
// balances of the vault's assets the run changed, by stand-in.
export type SimulationRun = {
  result: SimulationResult;
  account?: Account;
  faucetLabels?: Record<string, FaucetLabel>;
  vaultChanges?: { faucetId: string; amount: bigint }[];
};

// The stand-ins of the vault's rows, of the arguments' assets and faucets.
const argumentValues = (args: ProcedureArguments) =>
  Object.values(args).flatMap((argument) =>
    argument.type === "Asset"
      ? [argument.faucetId]
      : argument.type === "AccountId"
        ? [argument.accountId]
        : [],
  );

const resolveRows = (rows: AssetRow[], faucetIds: Map<string, string>) =>
  rowAssets(rows).map(({ faucetId, amount }) => ({
    faucetId: resolveSimulatedAsset(faucetId, faucetIds),
    amount,
  }));

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
  const assets = result.executedTransaction
    ? changedAssets(result.executedTransaction, account)
    : 0;
  const parts = [
    result.value && `returned ${result.value}`,
    changes &&
      (count === 0 ? "no storage change" : plural(count, "storage change")),
    assets > 0 && plural(assets, "vault change"),
  ].filter(Boolean);
  return `Simulated ${name}${parts.length > 0 ? `: ${parts.join(", ")}` : ""}.`;
};

// Simulates an account component's procedures on a throwaway account of the
// mock client, built from the script's package and the storage slots and
// vault shown. Every run starts from them, at nonce 0 (1 with assets, which a
// seed transaction put in the vault): nothing is persisted.
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
  const [vault, setVault] = useSimulationVault(script.id);
  const [assetSymbols, addAssetSymbol] = useSimulatedAssetSymbols(script.id);
  const simulatedAssets = useMemo(
    () => simulatedAssetOptions(assetSymbols),
    [assetSymbols],
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
  const invoke = (
    procedureExport: ProcedureExport,
    args: ProcedureArguments,
  ): Promise<SimulationRun> =>
    enqueueSimulation(async () => {
      const name = formatProcedureExportPath(procedureExport.path);
      let account: Account | undefined;
      let result: SimulationResult;
      let faucetIds = new Map<string, string>();
      try {
        result = await withSimulationClient(async (client) => {
          // The simulated assets the vault and the arguments name.
          faucetIds = await mockFaucetIds(
            client,
            usedSymbols([
              ...vault.map(({ faucetId }) => faucetId),
              ...argumentValues(args),
            ]),
          );
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
          // The stand-ins of the staged accounts and of the simulated assets,
          // replaced by their ids.
          const resolvedArgs = Object.fromEntries(
            Object.entries(args).map(([name, argument]) => {
              if (argument.type === "Asset") {
                return [
                  name,
                  {
                    ...argument,
                    faucetId: resolveSimulatedAsset(
                      argument.faucetId,
                      faucetIds,
                    ),
                  },
                ];
              }
              if (argument.type === "AccountId") {
                const faucetId = resolveSimulatedAsset(
                  argument.accountId,
                  faucetIds,
                );
                if (faucetId !== argument.accountId) {
                  return [name, { ...argument, accountId: faucetId }];
                }
              }
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
          const assets = resolveRows(vault, faucetIds);
          account = await simulatedAccount(
            client,
            `${script.id}:${script.commitment}:${JSON.stringify(storageSlots)}:${JSON.stringify(rowAssets(vault).map(({ faucetId, amount }) => [faucetId, amount.toString()]))}`,
            () =>
              createSimulatedAccount({
                client,
                name: script.name,
                components: [{ script, storageSlots }],
                assets,
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
      return {
        result,
        account,
        faucetLabels: mockFaucetLabels(faucetIds),
        vaultChanges:
          result.ok && result.executedTransaction
            ? vaultChanges(vaultBalances(result.executedTransaction), faucetIds)
            : undefined,
      };
    });
  return {
    storageSlots,
    setStorageSlots,
    vault,
    setVault,
    assetSymbols,
    addAssetSymbol,
    simulatedAssets,
    foreignAccounts,
    unresolvedForeignAccounts,
    foreignAccountsStatus,
    foreignAccountsReady,
    simulatedAccounts,
    invoke,
  };
};

export default useSimulation;
