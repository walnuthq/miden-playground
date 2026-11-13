import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Spinner } from "@workspace/ui/components/spinner";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProcedureArgumentsForm from "@/components/procedures/procedure-arguments-form";
import { notReady } from "@/components/script/simulate/not-ready";
import SimulationResultDialog, {
  type SimulatedTransaction,
} from "@/components/script/simulate/simulation-result-dialog";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import useScriptTargetAccounts from "@/hooks/use-script-target-accounts";
import useTargetSimulation from "@/hooks/use-target-simulation";
import type { Script } from "@/lib/types/script";
import {
  noteStorageFelts,
  noteStorageParams,
  noteStorageReady,
} from "@/lib/utils/note-storage";
import { isFelt, type ProcedureArguments } from "@/lib/utils/procedure-inputs";
import { isWordText } from "@/lib/utils/storage-slots";
import { accountIdParts } from "@/lib/web-client";

// A note or transaction script, simulated against one of the sandbox's
// accounts: as if the account consumed a note made from the script, or ran
// the transaction script.
const TargetSimulation = ({
  script,
  onFailure,
}: {
  script: Script;
  onFailure: () => void;
}) => {
  const { accounts, simulate } = useTargetSimulation(script);
  const isNote = script.type === "note";
  const [targetAccountId, setTargetAccountId] = useState("");
  // Only the accounts whose code has the procedures the script calls.
  const targets = useScriptTargetAccounts(script);
  const noTarget =
    targets.status === "filtered" &&
    targets.accountIds.size === 0 &&
    accounts.length > 0;
  // A recompile or a code change can rule out the selected account.
  useEffect(() => {
    if (
      targets.status !== "checking" &&
      targetAccountId !== "" &&
      !targets.accountIds.has(targetAccountId)
    ) {
      setTargetAccountId("");
    }
  }, [targets, targetAccountId]);
  const [argument, setArgument] = useState("");
  const [noteStorage, setNoteStorage] = useState<string[]>([]);
  const [noteArguments, setNoteArguments] = useState<ProcedureArguments>({});
  // One typed field per field of the note's storage schema, when the package
  // has one and the form can type every field. Raw felts otherwise.
  const noteStorageSchema = script.metadata?.noteStorage;
  const noteParams = useMemo(
    () => noteStorageSchema && noteStorageParams(noteStorageSchema.fields),
    [noteStorageSchema],
  );
  const [faucetAccountId, setFaucetAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [running, setRunning] = useState(false);
  const [simulation, setSimulation] = useState<SimulatedTransaction>();
  const blocked = notReady(script);
  const argumentValid = argument.trim() === "" || isWordText(argument);
  const noteStorageValid = noteParams
    ? noteStorageReady(noteParams, noteArguments)
    : noteStorage.every(isFelt);
  // In the asset's base units, like a note's assets.
  const amountValid = faucetAccountId === "" || /^[0-9]+$/.test(amount.trim());
  const idPrefix = `simulate-${script.id}`;
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {blocked ??
          (accounts.length === 0
            ? "Create or import an account to simulate the script against."
            : noTarget
              ? targets.missing.length > 0
                ? `No account has the procedures this script calls: ${targets.missing.join(", ")}. Deploy or import an account with them.`
                : "No account has every procedure this script calls. Deploy or import an account with them."
              : isNote
                ? "Runs the script locally as if the account consumed a note made from it: nothing is submitted."
                : "Runs the script locally against the account: nothing is submitted.")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Target account</Label>
          <SelectAccountDropdownMenu
            value={targetAccountId}
            onValueChange={setTargetAccountId}
            accountIds={targets.accountIds}
            checking={targets.status === "checking"}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-argument`}>
            {isNote ? "Note argument" : "Script argument"}
            <span className="font-normal text-muted-foreground">
              Word, optional
            </span>
          </Label>
          <Input
            id={`${idPrefix}-argument`}
            className="font-mono"
            placeholder="Felt or 0x word"
            value={argument}
            aria-invalid={!argumentValid}
            onChange={(event) => setArgument(event.target.value)}
          />
        </div>
        {isNote && (
          <>
            {noteParams ? (
              <div className="grid content-start gap-1.5 sm:col-span-2">
                <Label>Note storage</Label>
                {noteParams.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    This note has no storage.
                  </p>
                ) : (
                  <ProcedureArgumentsForm
                    idPrefix={`${idPrefix}-note`}
                    params={noteParams}
                    value={noteArguments}
                    onChange={setNoteArguments}
                  />
                )}
              </div>
            ) : (
              <div className="grid content-start gap-1.5">
                <Label>Note storage</Label>
                {noteStorageSchema && (
                  <p className="text-xs text-muted-foreground">
                    Felts, in the order of the note's fields:{" "}
                    {noteStorageSchema.fields
                      .map(
                        ({ name, type, width }) =>
                          `${name} (${type}${width === undefined ? "" : `, ${width} felt${width === 1 ? "" : "s"}`})`,
                      )
                      .join(", ")}
                    .
                  </p>
                )}
                {noteStorage.map((item, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id, only their position.
                  <div key={index} className="flex items-center gap-1.5">
                    <Input
                      aria-label={`Note storage item ${index + 1}`}
                      className="font-mono"
                      placeholder="Felt"
                      value={item}
                      aria-invalid={!isFelt(item)}
                      onChange={(event) =>
                        setNoteStorage(
                          noteStorage.with(index, event.target.value),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove note storage item ${index + 1}`}
                      onClick={() =>
                        setNoteStorage(noteStorage.toSpliced(index, 1))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => setNoteStorage([...noteStorage, ""])}
                >
                  <Plus />
                  Add storage item
                </Button>
              </div>
            )}
            <div className="grid content-start gap-1.5">
              <Label htmlFor={`${idPrefix}-amount`}>
                Asset
                <span className="font-normal text-muted-foreground">
                  optional, in base units
                </span>
              </Label>
              <div className="flex gap-2">
                <SelectAccountDropdownMenu
                  value={faucetAccountId}
                  onValueChange={setFaucetAccountId}
                  selectFaucets
                  showFaucetsAsAssets
                />
                <Input
                  id={`${idPrefix}-amount`}
                  className="font-mono"
                  placeholder="Amount"
                  inputMode="numeric"
                  value={amount}
                  aria-invalid={!amountValid}
                  disabled={faucetAccountId === ""}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <Button
        className="self-start"
        disabled={
          blocked !== undefined ||
          running ||
          targetAccountId === "" ||
          !argumentValid ||
          !noteStorageValid ||
          !amountValid
        }
        onClick={async () => {
          setRunning(true);
          try {
            const { result, account } = await simulate({
              targetAccountId,
              argument,
              noteStorage: noteParams
                ? noteStorageFelts({
                    params: noteParams,
                    args: noteArguments,
                    accountIdParts,
                  })
                : noteStorage,
              faucetAccountId,
              amount: faucetAccountId === "" ? 0n : BigInt(amount.trim()),
            });
            if (!result.ok || !result.executedTransaction || !account) {
              // The error is in the log.
              onFailure();
              return;
            }
            setSimulation({
              name: script.name,
              value: "",
              executedTransaction: result.executedTransaction,
              baseline: account,
              throwaway: false,
            });
          } finally {
            setRunning(false);
          }
        }}
      >
        {running && <Spinner />}
        {running ? "Simulating…" : "Simulate"}
      </Button>
      <SimulationResultDialog
        simulation={simulation}
        onClose={() => setSimulation(undefined)}
      />
    </div>
  );
};

export default TargetSimulation;
