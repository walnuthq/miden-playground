import { useMiden } from "@miden-sdk/react";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { appendConsoleEntry } from "@/lib/console-log";
import {
  type SimulationResult,
  simulateNote,
  simulateTransactionScript,
  storageChanges,
} from "@/lib/simulation/run";
import { enqueueSimulation } from "@/lib/simulation/simulation-client";
import type { Script } from "@/lib/types/script";
import { effectiveStorageChanges } from "@/lib/utils/storage-slots";

// What a note or transaction script simulation takes, as its form holds it.
export type TargetSimulationInputs = {
  targetAccountId: string;
  // The script's `Word` argument: a felt, a word in hex, or empty.
  argument: string;
  // A note's inputs (felts) and the asset it carries, none when no faucet.
  noteStorage: string[];
  faucetAccountId: string;
  amount: bigint;
};

// Simulates a note or transaction script against one of the sandbox's
// accounts, on the app's client: the transaction is executed only, which
// writes nothing to the store.
const useTargetSimulation = (script: Script) => {
  const { client } = useMiden();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  // Resolves to the run's result and the account's state it ran from.
  const simulate = ({
    targetAccountId,
    argument,
    noteStorage,
    faucetAccountId,
    amount,
  }: TargetSimulationInputs) =>
    enqueueSimulation(async () => {
      const account = accounts.find(({ id }) => id === targetAccountId);
      const result: SimulationResult =
        !client || !account
          ? { ok: false, error: "The client or the account isn't ready." }
          : script.type === "note"
            ? await simulateNote({
                client,
                targetAccountId,
                script,
                scripts,
                noteStorage,
                faucetAccountId,
                amount,
                noteArgument: argument,
              })
            : await simulateTransactionScript({
                client,
                targetAccountId,
                script,
                scriptArgument: argument,
              });
      if (result.ok && result.executedTransaction && account) {
        const { values, entries } = effectiveStorageChanges(
          account.storage,
          storageChanges(result.executedTransaction),
        );
        const count = values.length + entries.length;
        appendConsoleEntry(script.id, {
          level: "success",
          text: `Simulated ${script.name} on ${account.name}: ${
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
      return { result, account };
    });
  return { accounts, simulate };
};

export default useTargetSimulation;
