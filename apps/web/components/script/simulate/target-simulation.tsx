import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Spinner } from "@workspace/ui/components/spinner";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProcedureArgumentsForm from "@/components/procedures/procedure-arguments-form";
import DependencyAccounts from "@/components/script/simulate/dependency-accounts";
import { notReady } from "@/components/script/simulate/not-ready";
import SimulationResultDialog, {
  type SimulatedTransaction,
} from "@/components/script/simulate/simulation-result-dialog";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import useScriptTargetAccounts from "@/hooks/use-script-target-accounts";
import useScripts from "@/hooks/use-scripts";
import useTargetSimulation from "@/hooks/use-target-simulation";
import { storageChanges } from "@/lib/simulation/run";
import {
  SIMULATED_ASSET,
  SIMULATED_TARGET,
  simulatedTargetMissing,
} from "@/lib/simulation/simulated-target";
import { basicWalletScript } from "@/lib/tutorials/basic-wallet";
import defaultScripts from "@/lib/types/default-scripts";
import standardBasicWallet from "@/lib/types/default-scripts/basic-wallet";
import type { Script } from "@/lib/types/script";
import {
  noteStorageFelts,
  noteStorageParams,
  noteStorageReady,
} from "@/lib/utils/note-storage";
import { isFelt, type ProcedureArguments } from "@/lib/utils/procedure-inputs";
import {
  applyStorageChanges,
  isWordText,
  storageSlotsValid,
} from "@/lib/utils/storage-slots";

// The simulated account and asset, as the dropdowns offer them.
const SIMULATED_TARGET_OPTIONS = [
  { value: SIMULATED_TARGET, name: "Simulated account" },
];
const SIMULATED_ASSET_OPTIONS = [
  { value: SIMULATED_ASSET, name: "Simulated asset" },
];
const NO_ACCOUNTS = new Set<string>();

// The note's typed storage without any account field naming the simulated
// account.
const withoutSimulatedTarget = (args: ProcedureArguments) =>
  Object.fromEntries(
    Object.entries(args).filter(
      ([, argument]) =>
        argument.type !== "AccountId" ||
        argument.accountId !== SIMULATED_TARGET,
    ),
  );

// A note or transaction script, simulated against one of the sandbox's
// accounts or the simulated account (a throwaway account of the mock client
// holding its dependencies' components): as if the account consumed a note
// made from the script, or ran the transaction script.
const TargetSimulation = ({
  script,
  onFailure,
}: {
  script: Script;
  onFailure: () => void;
}) => {
  const { dependencyAccounts, simulate } = useTargetSimulation(script);
  const { scripts } = useScripts();
  const isNote = script.type === "note";
  const [targetAccountId, setTargetAccountId] = useState("");
  const simulatedPicked = targetAccountId === SIMULATED_TARGET;
  // Only the accounts whose code has the procedures the script calls.
  const targets = useScriptTargetAccounts(script);
  // A recompile or a code change can rule out the selected account. The
  // simulated account is always offered, and picked when no sandbox account
  // qualifies.
  useEffect(() => {
    if (targets.status === "checking") {
      return;
    }
    if (targetAccountId === "") {
      if (targets.accountIds.size === 0) {
        setTargetAccountId(SIMULATED_TARGET);
      }
    } else if (
      targetAccountId !== SIMULATED_TARGET &&
      !targets.accountIds.has(targetAccountId)
    ) {
      setTargetAccountId("");
    }
  }, [targets, targetAccountId]);
  // The procedures the script calls that the simulated account lacks.
  const missing = useMemo(
    () =>
      simulatedTargetMissing({
        script,
        components: dependencyAccounts.accounts.map(({ script }) => script),
        builtIns: [standardBasicWallet],
        // The Rust basic wallet names `receive-asset`, which the P2ID
        // template calls: it isn't a workspace script.
        named: [...scripts, ...defaultScripts, basicWalletScript],
      }),
    [script, dependencyAccounts.accounts, scripts],
  );
  const dependencySlotsValid = dependencyAccounts.accounts.every(
    ({ storageSlots }) => storageSlotsValid(storageSlots),
  );
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
  // Switching between the simulated account and a sandbox one: the assets
  // offered aren't the same, and an account field naming the simulated
  // account means nothing on a sandbox one.
  const [assetsForSimulated, setAssetsForSimulated] = useState(simulatedPicked);
  if (assetsForSimulated !== simulatedPicked) {
    setAssetsForSimulated(simulatedPicked);
    setFaucetAccountId("");
    setNoteArguments(withoutSimulatedTarget(noteArguments));
  }
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
          (simulatedPicked
            ? `${
                isNote
                  ? "Runs the script locally as if a throwaway account consumed a note made from it"
                  : "Runs the script locally on a throwaway account"
              }: nothing is submitted. ${
                dependencyAccounts.accounts.length > 0
                  ? "It holds the components of the script's dependencies, and every run starts from the storage below, at nonce 0."
                  : "It holds the basic wallet only, at nonce 0."
              }${
                dependencyAccounts.ready && missing.length > 0
                  ? ` It lacks procedures this script calls: ${missing.join(", ")}.`
                  : ""
              }`
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
            simulatedAccounts={SIMULATED_TARGET_OPTIONS}
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
                    simulatedAccounts={
                      simulatedPicked ? SIMULATED_TARGET_OPTIONS : undefined
                    }
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
                {simulatedPicked && (
                  <p className="text-xs text-muted-foreground">
                    The simulated account's id is known only during the run: a
                    note that names its target needs a package with a storage
                    schema.
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
                  {...(simulatedPicked && {
                    // A sandbox faucet would crash the mock client.
                    accountIds: NO_ACCOUNTS,
                    simulatedAccounts: SIMULATED_ASSET_OPTIONS,
                  })}
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
      {simulatedPicked &&
        (dependencyAccounts.accounts.length > 0 ||
          dependencyAccounts.unresolved.length > 0) && (
          <DependencyAccounts
            title="Simulated account"
            labelPrefix="Simulated account"
            {...(script.readOnly
              ? {
                  stale: "changed since this script was compiled.",
                  missing: "its compiled package isn't in the workspace.",
                }
              : {
                  stale:
                    "changed since this script was compiled. Compile this script again to run it against it.",
                  missing:
                    "its compiled package isn't in the workspace. Compile it, then this script, to run this script against it.",
                })}
            accounts={dependencyAccounts.accounts}
            unresolved={dependencyAccounts.unresolved}
          />
        )}
      <Button
        className="self-start"
        disabled={
          blocked !== undefined ||
          running ||
          targetAccountId === "" ||
          (simulatedPicked &&
            (!dependencyAccounts.ready || !dependencySlotsValid)) ||
          !argumentValid ||
          !noteStorageValid ||
          !amountValid
        }
        onClick={async () => {
          setRunning(true);
          try {
            const { result, account, faucetLabels } = await simulate({
              targetAccountId,
              argument,
              noteStorage: (accountIdParts) =>
                noteParams
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
              throwaway: simulatedPicked,
              faucetLabels,
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
        onApply={
          simulation?.throwaway && dependencyAccounts.accounts.length > 0
            ? ({ executedTransaction }) => {
                // Each component's slots take the changes to theirs.
                const changes = storageChanges(executedTransaction);
                for (const {
                  storageSlots,
                  setStorageSlots,
                } of dependencyAccounts.accounts) {
                  setStorageSlots(applyStorageChanges(storageSlots, changes));
                }
              }
            : undefined
        }
      />
    </div>
  );
};

export default TargetSimulation;
