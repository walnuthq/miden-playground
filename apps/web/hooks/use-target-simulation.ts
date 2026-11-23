import type { WebClient as WebClientType } from "@miden-sdk/miden-sdk";
import { useMiden } from "@miden-sdk/react";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useDependencyAccounts from "@/hooks/use-dependency-accounts";
import useScripts from "@/hooks/use-scripts";
import type { SimulationRun } from "@/hooks/use-simulation";
import { trackEvent } from "@/lib/analytics";
import { appendConsoleEntry } from "@/lib/console-log";
import { simulatedAccountName } from "@/lib/simulation/foreign-accounts";
import {
  changedAssets,
  createSimulatedAccount,
  mockFaucetIds,
  mockFaucetLabels,
  runOnSandboxAccount,
  type SimulatedAsset,
  simulateNote,
  simulateTransactionScript,
  stageForeignAccount,
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
import {
  useForeignDependencyNames,
  useSimulationVault,
} from "@/lib/simulation/simulation-state";
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

// A run, and the ids of the foreign accounts it staged, by dependency name.
export type TargetSimulationRun = SimulationRun & {
  stagedIds?: Map<string, string>;
};

// The account id splitter, with the stand-ins replaced by their ids: the
// simulated account built for a run on it, the foreign accounts the run
// staged (by dependency name), the faucets it made. None on a sandbox
// account.
const resolvingAccountIdParts =
  (
    simulatedId?: string,
    faucetIds = new Map<string, string>(),
    stagedIds = new Map<string, string>(),
  ): AccountIdParts =>
  (accountId) => {
    if (accountId === SIMULATED_TARGET) {
      if (!simulatedId) {
        throw new Error(
          "The note's storage names the simulated account: pick it as the target, or name another account.",
        );
      }
      return accountIdParts(simulatedId);
    }
    const foreignName = simulatedAccountName(accountId);
    if (foreignName !== undefined) {
      const stagedId = stagedIds.get(foreignName);
      if (!stagedId) {
        throw new Error(
          `The note's storage names the foreign account ${foreignName}, which this run doesn't stage: mark the dependency as a foreign account on the simulated account, or name another account.`,
        );
      }
      return accountIdParts(stagedId);
    }
    return accountIdParts(resolveSimulatedAsset(accountId, faucetIds));
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
// 0 (1 with assets, which a seed transaction put in the vault). A dependency
// marked as a foreign account isn't one of its components: it's staged on
// the mock chain instead, for the script's foreign calls.
const useTargetSimulation = (script: Script) => {
  const { client } = useMiden();
  const { tutorialId } = useGlobalContext();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const dependencyAccounts = useDependencyAccounts(script);
  // The dependencies the script calls on another account, by name: the user
  // says which, the package doesn't.
  const [foreignNames, setForeignDependency] = useForeignDependencyNames(
    script.id,
  );
  const foreignAccounts = dependencyAccounts.accounts.filter(({ name }) =>
    foreignNames.includes(name),
  );
  const targetComponents = dependencyAccounts.accounts.filter(
    ({ name }) => !foreignNames.includes(name),
  );
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
    stagedIds,
  }: {
    runClient: WebClientType;
    targetAccountId: string;
    inputs: TargetSimulationInputs;
    assets: SimulatedAsset[];
    simulatedId?: string;
    faucetIds?: Map<string, string>;
    stagedIds?: Map<string, string>;
  }) =>
    isNote
      ? simulateNote({
          client: runClient,
          targetAccountId,
          script,
          scripts,
          noteStorage: noteStorage(
            resolvingAccountIdParts(simulatedId, faucetIds, stagedIds),
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
  // The run on the simulated account, in the mock client. `onThrow` tells the
  // run threw, for analytics.
  const runSimulated = async (
    inputs: TargetSimulationInputs,
    onThrow: () => void,
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
    // The foreign accounts' ids, by dependency name.
    const stagedIds = new Map<string, string>();
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
        // The foreign accounts first, each committed in a block of the mock
        // chain, as for an account component's foreign calls.
        for (const foreignAccount of foreignAccounts) {
          const staged = await simulatedAccount(
            mockClient,
            `foreign:${foreignAccount.script.commitment}:${JSON.stringify(foreignAccount.storageSlots)}`,
            () =>
              stageForeignAccount({
                client: mockClient,
                script: foreignAccount.script,
                storageSlots: foreignAccount.storageSlots,
              }),
          );
          stagedIds.set(foreignAccount.name, staged.id);
        }
        const components = targetComponents.map(({ script, storageSlots }) => ({
          script,
          storageSlots,
        }));
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
          stagedIds,
        });
      });
      return {
        result,
        account,
        stagedIds,
        faucetLabels: mockFaucetLabels(faucetIds),
        vaultChanges:
          result.ok && result.executedTransaction
            ? vaultChanges(vaultBalances(result.executedTransaction), faucetIds)
            : undefined,
      };
    } catch (error) {
      // A crash or a timeout of the mock client, which was reset.
      onThrow();
      return {
        result: { ok: false, error: errorMessage(error) },
        account,
        stagedIds,
      };
    }
  };
  // The run on a sandbox account, in the app's client.
  const runSandbox = async (
    inputs: TargetSimulationInputs,
  ): Promise<TargetSimulationRun> => {
    if (
      usedSymbols([
        ...inputs.noteAssets.map(({ faucetId }) => faucetId),
        ...inputs.noteStorageAccountIds,
      ]).length > 0
    ) {
      return {
        result: { ok: false, error: SIMULATED_ONLY },
        account: accounts.find(({ id }) => id === inputs.targetAccountId),
      };
    }
    return runOnSandboxAccount({
      client,
      accounts,
      accountId: inputs.targetAccountId,
      run: (runClient) =>
        run({
          runClient,
          targetAccountId: inputs.targetAccountId,
          inputs,
          assets: rowAssets(inputs.noteAssets),
        }),
    });
  };
  // Resolves to the run's result and the account's state it ran from.
  const simulate = (inputs: TargetSimulationInputs) =>
    enqueueSimulation(async () => {
      const simulated = inputs.targetAccountId === SIMULATED_TARGET;
      let thrown = false;
      const outcome = simulated
        ? await runSimulated(inputs, () => {
            thrown = true;
          })
        : await runSandbox(inputs);
      const { result, account } = outcome;
      trackEvent("simulate", {
        script_type: script.type,
        outcome: thrown ? "failed" : result.ok ? "ok" : "error",
        target: simulated ? "simulated" : "sandbox",
        tutorial_id: tutorialId,
      });
      // A transaction script or a raw-felt note can only name a foreign
      // account by its id, known once it's staged.
      const staged =
        outcome.stagedIds && outcome.stagedIds.size > 0
          ? [...outcome.stagedIds]
              .map(([name, id]) => `Foreign account ${name}: ${id}`)
              .join("\n")
          : "";
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
          output: staged,
        });
      } else {
        appendConsoleEntry(script.id, {
          level: "error",
          text: `Simulation of ${script.name} failed.`,
          output: [result.ok ? "" : result.error, staged]
            .filter(Boolean)
            .join("\n\n"),
        });
      }
      return outcome;
    });
  return {
    accounts,
    dependencyAccounts,
    targetComponents,
    foreignAccounts,
    setForeignDependency,
    vault,
    setVault,
    simulate,
  };
};

export default useTargetSimulation;
