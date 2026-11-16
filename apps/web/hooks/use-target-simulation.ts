import type { WebClient as WebClientType } from "@miden-sdk/miden-sdk";
import { useMiden } from "@miden-sdk/react";
import type { FaucetLabel } from "@/components/lib/fungible-assets-table";
import useAccounts from "@/hooks/use-accounts";
import useDependencyAccounts from "@/hooks/use-dependency-accounts";
import useScripts from "@/hooks/use-scripts";
import { appendConsoleEntry } from "@/lib/console-log";
import {
  createSimulatedAccount,
  MOCK_FAUCET_LABEL,
  mockFaucet,
  type SimulationResult,
  simulateNote,
  simulateTransactionScript,
  storageChanges,
} from "@/lib/simulation/run";
import { simulatedAccount } from "@/lib/simulation/simulated-accounts";
import {
  SIMULATED_ASSET,
  SIMULATED_TARGET,
} from "@/lib/simulation/simulated-target";
import {
  enqueueSimulation,
  withSimulationClient,
} from "@/lib/simulation/simulation-client";
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
  // that an account field naming the simulated account gets its id, known
  // only during the run.
  noteStorage: (accountIdParts: AccountIdParts) => string[];
  // The asset the note carries, none when no faucet: a sandbox faucet's id,
  // or `SIMULATED_ASSET` on the simulated account.
  faucetAccountId: string;
  amount: bigint;
};

// A run's result, the account's state it ran from, and the labels of the
// faucets the app doesn't know (the simulated asset's).
export type TargetSimulationRun = {
  result: SimulationResult;
  account?: Account;
  faucetLabels?: Record<string, FaucetLabel>;
};

// The account id splitter, with the simulated account's stand-in replaced by
// its id: the account built for a run on it. None on a sandbox account.
const resolvingAccountIdParts =
  (simulatedId?: string): AccountIdParts =>
  (accountId) => {
    if (accountId !== SIMULATED_TARGET) {
      return accountIdParts(accountId);
    }
    if (!simulatedId) {
      throw new Error(
        "The note's storage names the simulated account: pick it as the target, or name another account.",
      );
    }
    return accountIdParts(simulatedId);
  };

const errorMessage = (error: unknown) =>
  cleanExecutionError(error instanceof Error ? error.message : String(error));

// Simulates a note or transaction script against an account. A sandbox
// account runs on the app's client: the transaction is executed only, which
// writes nothing to the store. The simulated account (`SIMULATED_TARGET`)
// runs on the mock client: a throwaway account holding the script's
// dependencies' components, built from the storage slots shown, never
// committed. Every run starts from those slots, at nonce 0.
const useTargetSimulation = (script: Script) => {
  const { client } = useMiden();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const dependencyAccounts = useDependencyAccounts(script);
  const isNote = script.type === "note";
  // `faucetId` is the asset's real faucet; `simulatedId` the simulated
  // account's id, on a run on it.
  const run = ({
    runClient,
    targetAccountId,
    inputs: { argument, noteStorage, amount },
    faucetId,
    simulatedId,
  }: {
    runClient: WebClientType;
    targetAccountId: string;
    inputs: TargetSimulationInputs;
    faucetId: string;
    simulatedId?: string;
  }) =>
    isNote
      ? simulateNote({
          client: runClient,
          targetAccountId,
          script,
          scripts,
          noteStorage: noteStorage(resolvingAccountIdParts(simulatedId)),
          faucetAccountId: faucetId,
          amount,
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
      inputs.faucetAccountId !== "" &&
      inputs.faucetAccountId !== SIMULATED_ASSET
    ) {
      // Any other faucet would crash the mock client.
      return {
        result: {
          ok: false,
          error:
            "The simulated account can only receive the simulated asset: pick it, or no asset.",
        },
      };
    }
    let account: Account | undefined;
    let faucetId = "";
    try {
      const result = await withSimulationClient(async (mockClient) => {
        const components = dependencyAccounts.accounts.map(
          ({ script, storageSlots }) => ({ script, storageSlots }),
        );
        account = await simulatedAccount(
          mockClient,
          `target:${JSON.stringify(
            components.map(({ script, storageSlots }) => [
              script.commitment,
              storageSlots,
            ]),
          )}`,
          () =>
            createSimulatedAccount({
              client: mockClient,
              name: "Simulated account",
              components,
            }),
        );
        if (inputs.faucetAccountId === SIMULATED_ASSET) {
          faucetId = await mockFaucet(mockClient);
        }
        return run({
          runClient: mockClient,
          targetAccountId: account.id,
          inputs,
          faucetId,
          simulatedId: account.id,
        });
      });
      return {
        result,
        account,
        faucetLabels: faucetId ? { [faucetId]: MOCK_FAUCET_LABEL } : undefined,
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
    if (inputs.faucetAccountId === SIMULATED_ASSET) {
      return {
        result: {
          ok: false,
          error:
            "The simulated asset exists only on the simulated account: pick another asset.",
        },
        account,
      };
    }
    try {
      return {
        result: await run({
          runClient: client,
          targetAccountId: inputs.targetAccountId,
          inputs,
          faucetId: inputs.faucetAccountId,
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
        appendConsoleEntry(script.id, {
          level: "success",
          text: `Simulated ${script.name} on ${
            simulated ? "the simulated account" : account.name
          }: ${
            count === 0
              ? "no storage change"
              : `${count} storage change${count === 1 ? "" : "s"}`
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
  return { accounts, dependencyAccounts, simulate };
};

export default useTargetSimulation;
