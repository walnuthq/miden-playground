import { useMiden } from "@miden-sdk/react";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import type { SimulationRun } from "@/hooks/use-simulation";
import { runOnSandboxAccount, simulateNote } from "@/lib/simulation/run";
import { enqueueSimulation } from "@/lib/simulation/simulation-client";
import type { NoteType } from "@/lib/types/note";

// The note the Create Note dialog is about to create.
export type NotePreviewInputs = {
  senderAccountId: string;
  recipientAccountId: string;
  scriptId: string;
  noteType: NoteType;
  isNetworkNote: boolean;
  assets: { faucetId: string; amount: bigint }[];
  // The note's storage, as felts.
  noteStorage: string[];
};

// Previews a note's consumption before it's created: the recipient consumes
// a note made from the dialog's inputs, executed only on the app's client
// (the recipient is a sandbox account, which the mock client can't hold),
// so nothing is proven, submitted or written to the store. The creating
// transaction, which the wallet signs, isn't run.
const useNotePreview = () => {
  const { client } = useMiden();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  // Resolves to the run's result and the recipient's state it ran from.
  const previewConsumption = ({
    senderAccountId,
    recipientAccountId,
    scriptId,
    noteType,
    isNetworkNote,
    assets,
    noteStorage,
  }: NotePreviewInputs): Promise<SimulationRun> =>
    // Behind the Simulate tab's runs and target checks, which share the
    // client.
    enqueueSimulation(async () => {
      const script = scripts.find(({ id }) => id === scriptId);
      if (!script) {
        return { result: { ok: false, error: "The script wasn't found." } };
      }
      return runOnSandboxAccount({
        client,
        accounts,
        accountId: recipientAccountId,
        run: (runClient) =>
          simulateNote({
            client: runClient,
            targetAccountId: recipientAccountId,
            senderAccountId: senderAccountId || recipientAccountId,
            noteType,
            isNetworkNote,
            script,
            scripts,
            noteStorage,
            assets,
            noteArgument: "",
          }),
      });
    });
  return { previewConsumption };
};

export default useNotePreview;
