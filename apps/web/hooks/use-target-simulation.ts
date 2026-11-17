import type { WebClient as WebClientType } from "@miden-sdk/miden-sdk";
import { useMiden } from "@miden-sdk/react";
import useAccounts from "@/hooks/use-accounts";
import useDependencyAccounts from "@/hooks/use-dependency-accounts";
import useScripts from "@/hooks/use-scripts";
import type { SimulationRun } from "@/hooks/use-simulation";
import { appendConsoleEntry } from "@/lib/console-log";
import {
  changedAssets,
  createSimulatedAccount,
  mockFaucetIds,
  mockFaucetLabels,
  type SimulatedAsset,
  simulateNote,
  simulateTransactionScript,
  storageChanges,
  vaultBalances,
} from "@/lib/simulation/run";
import { simulatedAccount } from "@/lib/simulation/simulated-accounts";
import {
  type AssetRow,
  resolveSimulatedAsset,
  rowAssets,
  simulatedAssetSymbol,
  usedSymbols,
  vaultChanges,
} from "@/lib/simulation/simulated-assets";
import { SIMULATED_TARGET } from "@/lib/simulation/simulated-target";
import {
  enqueueSimulation,
  withSimulationClient,
} from "@/lib/simulation/simulation-client";
import { useSimulationVault } from "@/lib/simulation/simulation-state";
import type { Account } from "@/lib/types/account";
import type { Script } from "@/lib/types/script";
import { cleanExecutionError } from "@/lib/utils/procedure-inputs";
import { effectiveStorageChanges } from "@/lib/utils/storage-slots";
import { accountIdParts } from "@/lib/web-client";

type AccountIdParts = (accountId: string) => { prefix: bigint; suffix: bigint };

// What a note or transaction script simulation takes, as its form holds it.
export type TargetSimulationInputs = {
  // A sandbox account's id, or `SIMULATED_TARGET`.
  targetAccountId: string;
  // The script's `Word` argument: a felt, a word in hex, or empty.
  argument: string;
  // A note's storage, as felts. A function of the account id splitter, so
  // that an account field naming the simulated account or a simulated
  // asset's faucet gets its id, known only during the run.
  noteStorage: (accountIdParts: AccountIdParts) => string[];
  // The account ids the note's storage names, stand-ins included.
  noteStorageAccountIds: string[];
  // The assets the note carries: sandbox faucets, or simulated assets'
  // stand-ins on the simulated account.
  noteAssets: AssetRow[];
};

export type TargetSimulationRun = SimulationRun;

// The account id splitter, with the simulated account's and the simulated
// assets' stand-ins replaced by their ids: the account built for a run on it,
// the faucets the run made. None on a sandbox account.
const resolvingAccountIdParts =
  (
    simulatedId?: string,
    faucetIds = new Map<string, string>(),
  ): AccountIdParts =>
  (accountId) => {
    if (accountId !== SIMULATED_TARGET) {
      return accountIdParts(resolveSimulatedAsset(accountId, faucetIds));
    }
    if (!simulatedId) {
      throw new Error(
        "The note's storage names the simulated account: pick it as the target, or name another account.",
      );
    }
    return accountIdParts(simulatedId);
  };

const SIMULATED_ONLY =
  "Simulated assets exist only on the simulated account: pick it as the target, or a sandbox faucet.";

const errorMessage = (error: unknown) =>
  cleanExecutionError(error instanceof Error ? error.message : String(error));

// Simulates a note or transaction script against an account. A sandbox
// account runs on the app's client: the transaction is executed only, which
// writes nothing to the store. The simulated account (`SIMULATED_TARGET`)
// runs on the mock client: a throwaway account holding the script's
// dependencies' components, built from the storage slots shown, never
// committed. Every run starts from those slots and the vault shown, at nonce
// 0 (1 with assets, which a seed transaction put in the vault).
const useTargetSimulation = (script: Script) => {
  const { client } = useMiden();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const dependencyAccounts = useDependencyAccounts(script);
  // The simulated account's vault: one account, whatever its dependencies.
  const [vault, setVault] = useSimulationVault(script.id);
  const isNote = script.type === "note";
  // `assets` are the note's, with real faucets; `simulatedId` the simulated
  // account's id and `faucetIds` the simulated assets' faucets, on a run on
  // it.
  const run = ({
    runClient,
    targetAccountId,
    inputs: { argument, noteStorage },
    assets,
    simulatedId,
    faucetIds,
  }: {
    runClient: WebClientType;
    targetAccountId: string;
    inputs: TargetSimulationInputs;
    assets: SimulatedAsset[];
    simulatedId?: string;
    faucetIds?: Map<string, string>;
  }) =>
    isNote
      ? simulateNote({
          client: runClient,
          targetAccountId,
          script,
          scripts,
          noteStorage: noteStorage(
            resolvingAccountIdParts(simulatedId, faucetIds),
          ),
          assets,
          noteArgument: argument,
        })
      : simulateTransactionScript({
          client: runClient,
          targetAccountId,
          script,
          scriptArgument: argument,
        });
  // The run on the simulated account, in the mock client.
  const runSimulated = async (
    inputs: TargetSimulationInputs,
  ): Promise<TargetSimulationRun> => {
    if (
      inputs.noteAssets.some(
        ({ faucetId }) => simulatedAssetSymbol(faucetId) === undefined,
      )
    ) {
      // Any other faucet would crash the mock client.
      return {
        result: {
          ok: false,
          error:
            "The simulated account can only receive simulated assets: pick one, or no asset.",
        },
      };
    }
    let account: Account | undefined;
    let faucetIds = new Map<string, string>();
    try {
      const result = await withSimulationClient(async (mockClient) => {
        faucetIds = await mockFaucetIds(
          mockClient,
          usedSymbols([
            ...vault.map(({ faucetId }) => faucetId),
            ...inputs.noteAssets.map(({ faucetId }) => faucetId),
            ...inputs.noteStorageAccountIds,
          ]),
        );
        const resolve = (rows: AssetRow[]) =>
          rowAssets(rows).map(({ faucetId, amount }) => ({
            faucetId: resolveSimulatedAsset(faucetId, faucetIds),
            amount,
          }));
        const components = dependencyAccounts.accounts.map(
          ({ script, storageSlots }) => ({ script, storageSlots }),
        );
        account = await simulatedAccount(
          mockClient,
          `target:${JSON.stringify([
            components.map(({ script, storageSlots }) => [
              script.commitment,
              storageSlots,
            ]),
            rowAssets(vault).map(({ faucetId, amount }) => [
              faucetId,
              amount.toString(),
            ]),
          ])}`,
          () =>
            createSimulatedAccount({
              client: mockClient,
              name: "Simulated account",
              components,
              assets: resolve(vault),
            }),
        );
        return run({
          runClient: mockClient,
          targetAccountId: account.id,
          inputs,
          assets: resolve(inputs.noteAssets),
          simulatedId: account.id,
          faucetIds,
        });
      });
      return {
        result,
        account,
        faucetLabels: mockFaucetLabels(faucetIds),
        vaultChanges:
          result.ok && result.executedTransaction
            ? vaultChanges(vaultBalances(result.executedTransaction), faucetIds)
            : undefined,
      };
    } catch (error) {
      // A crash or a timeout of the mock client, which was reset.
      return { result: { ok: false, error: errorMessage(error) }, account };
    }
  };
  // The run on a sandbox account, in the app's client.
  const runSandbox = async (
    inputs: TargetSimulationInputs,
  ): Promise<TargetSimulationRun> => {
    const account = accounts.find(({ id }) => id === inputs.targetAccountId);
    if (!client || !account) {
      return {
        result: { ok: false, error: "The client or the account isn't ready." },
        account,
      };
    }
    if (
      usedSymbols([
        ...inputs.noteAssets.map(({ faucetId }) => faucetId),
        ...inputs.noteStorageAccountIds,
      ]).length > 0
    ) {
      return { result: { ok: false, error: SIMULATED_ONLY }, account };
    }
    try {
      return {
        result: await run({
          runClient: client,
          targetAccountId: inputs.targetAccountId,
          inputs,
          assets: rowAssets(inputs.noteAssets),
        }),
        account,
      };
    } catch (error) {
      return { result: { ok: false, error: errorMessage(error) }, account };
    }
  };
  // Resolves to the run's result and the account's state it ran from.
  const simulate = (inputs: TargetSimulationInputs) =>
    enqueueSimulation(async () => {
      const simulated = inputs.targetAccountId === SIMULATED_TARGET;
      const outcome = simulated
        ? await runSimulated(inputs)
        : await runSandbox(inputs);
      const { result, account } = outcome;
      if (result.ok && result.executedTransaction && account) {
        const { values, entries } = effectiveStorageChanges(
          account.storage,
          storageChanges(result.executedTransaction),
        );
        const count = values.length + entries.length;
        const assets = changedAssets(result.executedTransaction, account);
        appendConsoleEntry(script.id, {
          level: "success",
          text: `Simulated ${script.name} on ${
            simulated ? "the simulated account" : account.name
          }: ${
            count === 0
              ? "no storage change"
              : `${count} storage change${count === 1 ? "" : "s"}`
          }${
            assets > 0
              ? `, ${assets} vault change${assets === 1 ? "" : "s"}`
              : ""
          }.`,
        });
      } else {
        appendConsoleEntry(script.id, {
          level: "error",
          text: `Simulation of ${script.name} failed.`,
          output: result.ok ? "" : result.error,
        });
      }
      return outcome;
    });
  return { accounts, dependencyAccounts, vault, setVault, simulate };
};

export default useTargetSimulation;
