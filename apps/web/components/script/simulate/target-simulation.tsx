import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Spinner } from "@workspace/ui/components/spinner";
import { useEffect, useMemo, useState } from "react";
import NoteStorageFields from "@/components/procedures/note-storage-fields";
import VaultEditor from "@/components/procedures/vault-editor";
import DependencyAccounts from "@/components/script/simulate/dependency-accounts";
import { notReady } from "@/components/script/simulate/not-ready";
import SimulationResultDialog, {
  type SimulatedTransaction,
} from "@/components/script/simulate/simulation-result-dialog";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import useNetwork from "@/hooks/use-network";
import useScriptTargetAccounts from "@/hooks/use-script-target-accounts";
import useScripts from "@/hooks/use-scripts";
import useTargetSimulation from "@/hooks/use-target-simulation";
import { hasSimulatedAccounts } from "@/lib/simulation/can-simulate";
import {
  SIMULATED_PREFIX,
  simulatedAccountValue,
} from "@/lib/simulation/foreign-accounts";
import { storageChanges } from "@/lib/simulation/run";
import {
  type AssetRow,
  applyVaultChanges,
  assetRowsError,
  simulatedAssetOptions,
} from "@/lib/simulation/simulated-assets";
import {
  SIMULATED_TARGET,
  simulatedTargetMissing,
} from "@/lib/simulation/simulated-target";
import { useSimulatedAssetSymbols } from "@/lib/simulation/simulation-state";
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

// The simulated account, as the dropdowns offer it.
const SIMULATED_TARGET_OPTIONS = [
  { value: SIMULATED_TARGET, name: "Simulated account" },
];
const NO_ASSETS: AssetRow[] = [];

// The note's typed storage without any account field naming the simulated
// account, a foreign account staged for it or a simulated asset's faucet.
const withoutSimulatedIds = (args: ProcedureArguments) =>
  Object.fromEntries(
    Object.entries(args).filter(
      ([, argument]) =>
        argument.type !== "AccountId" ||
        !argument.accountId.startsWith(SIMULATED_PREFIX),
    ),
  );

// The account ids the note's typed storage names.
const accountIdsOf = (args: ProcedureArguments) =>
  Object.values(args).flatMap((argument) =>
    argument.type === "AccountId" ? [argument.accountId] : [],
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
  const {
    dependencyAccounts,
    targetComponents,
    foreignAccounts,
    setForeignDependency,
    vault,
    setVault,
    simulate,
  } = useTargetSimulation(script);
  // What an account field of the note's storage can name on the simulated
  // account: the account itself and the foreign accounts staged for it.
  const simulatedAccountOptions = useMemo(
    () => [
      ...SIMULATED_TARGET_OPTIONS,
      ...foreignAccounts.map(({ name }) => ({
        value: simulatedAccountValue(name),
        name: `${name} (foreign account)`,
      })),
    ],
    [foreignAccounts],
  );
  const [assetSymbols, addAssetSymbol] = useSimulatedAssetSymbols(script.id);
  const simulatedAssets = useMemo(
    () => simulatedAssetOptions(assetSymbols),
    [assetSymbols],
  );
  const { scripts } = useScripts();
  const isNote = script.type === "note";
  const [targetAccountId, setTargetAccountId] = useState("");
  // Not on the MockChain sandbox, where the script runs on the sandbox's
  // accounts only.
  const { networkId } = useNetwork();
  const simulatedOffered = hasSimulatedAccounts(networkId);
  const simulatedPicked = targetAccountId === SIMULATED_TARGET;
  // Only the accounts whose code has the procedures the script calls.
  const targets = useScriptTargetAccounts(script);
  // A recompile or a code change can rule out the selected account. The
  // simulated account, where there is one, is always offered, and picked
  // when no sandbox account qualifies.
  useEffect(() => {
    if (targets.status === "checking") {
      return;
    }
    if (targetAccountId === "") {
      if (simulatedOffered && targets.accountIds.size === 0) {
        setTargetAccountId(SIMULATED_TARGET);
      }
    } else if (
      targetAccountId === SIMULATED_TARGET
        ? !simulatedOffered
        : !targets.accountIds.has(targetAccountId)
    ) {
      setTargetAccountId("");
    }
  }, [targets, targetAccountId, simulatedOffered]);
  // The procedures the script calls that the simulated account lacks.
  const missing = useMemo(
    () =>
      simulatedTargetMissing({
        script,
        components: targetComponents.map(({ script }) => script),
        builtIns: [standardBasicWallet],
        named: [...scripts, ...defaultScripts],
      }),
    [script, targetComponents, scripts],
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
  // The assets the note carries.
  const [noteAssets, setNoteAssets] = useState(NO_ASSETS);
  // Switching between the simulated account and a sandbox one: the assets
  // offered aren't the same, and an account field naming the simulated
  // account or a simulated asset's faucet means nothing on a sandbox one.
  const [assetsForSimulated, setAssetsForSimulated] = useState(simulatedPicked);
  if (assetsForSimulated !== simulatedPicked) {
    setAssetsForSimulated(simulatedPicked);
    setNoteAssets(NO_ASSETS);
    setNoteArguments(withoutSimulatedIds(noteArguments));
  }
  const [running, setRunning] = useState(false);
  const [simulation, setSimulation] = useState<SimulatedTransaction>();
  const blocked = notReady(script);
  const argumentValid = argument.trim() === "" || isWordText(argument);
  const noteStorageValid = noteParams
    ? noteStorageReady(noteParams, noteArguments)
    : noteStorage.every(isFelt);
  // In the assets' base units, like a note's assets.
  const noteAssetsValid =
    assetRowsError(noteAssets, assetSymbols) === undefined;
  const vaultValid = assetRowsError(vault, assetSymbols) === undefined;
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
                targetComponents.length > 0
                  ? "It holds the components of the script's dependencies, and every run starts from the vault and the storage below"
                  : "It holds the basic wallet only, and every run starts from the vault below"
              }: at nonce 0, or 1 when the vault holds assets (a first transaction puts them there).${
                foreignAccounts.length > 0
                  ? " A dependency marked as a foreign account is another account, which the script's foreign calls read: its id is in the log after a run."
                  : dependencyAccounts.accounts.length > 0
                    ? " If the script calls a dependency on another account, mark it as a foreign account below."
                    : ""
              }${
                dependencyAccounts.ready && missing.length > 0
                  ? ` It lacks procedures this script calls: ${missing.join(", ")}.`
                  : ""
              }`
            : `${
                isNote
                  ? "Runs the script locally as if the account consumed a note made from it"
                  : "Runs the script locally against the account"
              }: nothing is submitted.${
                simulatedOffered
                  ? ""
                  : targets.status !== "checking" &&
                      targets.accountIds.size === 0
                    ? " None of the sandbox's accounts has the procedures this script calls: deploy one that does."
                    : " On the MockChain sandbox it runs on the sandbox's accounts."
              }`)}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Target account</Label>
          <SelectAccountDropdownMenu
            value={targetAccountId}
            onValueChange={setTargetAccountId}
            accountIds={targets.accountIds}
            checking={targets.status === "checking"}
            simulatedAccounts={
              simulatedOffered ? SIMULATED_TARGET_OPTIONS : undefined
            }
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
            <NoteStorageFields
              idPrefix={idPrefix}
              schema={noteStorageSchema ?? undefined}
              params={noteParams}
              args={noteArguments}
              onArgsChange={setNoteArguments}
              felts={noteStorage}
              onFeltsChange={setNoteStorage}
              simulatedAccounts={
                simulatedPicked ? simulatedAccountOptions : undefined
              }
              simulatedAssets={simulatedPicked ? simulatedAssets : undefined}
              rawNote={
                simulatedPicked
                  ? "The simulated account's id is known only during the run: a note that names its target needs a package with a storage schema."
                  : undefined
              }
              typedClassName="sm:col-span-2"
            />
            <div className="grid content-start gap-1.5 sm:col-span-2">
              <Label>
                Note assets
                <span className="font-normal text-muted-foreground">
                  optional, in base units
                </span>
              </Label>
              {/* On the simulated account, the simulated assets only: a
                  sandbox faucet would crash the mock client. On a sandbox
                  account, the sandbox's faucets only. */}
              <VaultEditor
                label="Note"
                rows={noteAssets}
                onChange={setNoteAssets}
                simulatedAssets={simulatedPicked ? simulatedAssets : []}
                sandboxFaucets={!simulatedPicked}
                symbols={assetSymbols}
                onNewAsset={simulatedPicked ? addAssetSymbol : undefined}
                empty="The note carries no asset."
              />
            </div>
          </>
        )}
      </div>
      {simulatedPicked && (
        // One account, one vault: above its components' storage.
        <section
          aria-label="Simulated account vault"
          className="flex flex-col gap-2"
        >
          <h3 className="text-xs font-medium">Simulated account vault</h3>
          <VaultEditor
            label="Vault"
            rows={vault}
            onChange={setVault}
            simulatedAssets={simulatedAssets}
            symbols={assetSymbols}
            onNewAsset={addAssetSymbol}
            empty="The vault is empty."
          />
        </section>
      )}
      {simulatedPicked &&
        (dependencyAccounts.accounts.length > 0 ||
          dependencyAccounts.unresolved.length > 0) && (
          <DependencyAccounts
            title="Simulated account storage"
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
            foreign={{
              idPrefix,
              labelPrefix: "Foreign account",
              names: foreignAccounts.map(({ name }) => name),
              onChange: setForeignDependency,
            }}
          />
        )}
      <Button
        className="self-start"
        disabled={
          blocked !== undefined ||
          running ||
          targetAccountId === "" ||
          (simulatedPicked &&
            (!dependencyAccounts.ready ||
              !dependencySlotsValid ||
              !vaultValid)) ||
          !argumentValid ||
          !noteStorageValid ||
          (isNote && !noteAssetsValid)
        }
        onClick={async () => {
          setRunning(true);
          try {
            const { result, account, faucetLabels, vaultChanges } =
              await simulate({
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
                noteStorageAccountIds: noteParams
                  ? accountIdsOf(noteArguments)
                  : [],
                noteAssets: isNote ? noteAssets : NO_ASSETS,
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
              vaultChanges,
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
          simulation?.throwaway
            ? ({ executedTransaction, vaultChanges }) => {
                // Each component's slots take the changes to theirs. A
                // foreign account's don't change: a foreign call only reads.
                const changes = storageChanges(executedTransaction);
                for (const {
                  storageSlots,
                  setStorageSlots,
                } of targetComponents) {
                  setStorageSlots(applyStorageChanges(storageSlots, changes));
                }
                setVault(applyVaultChanges(vault, vaultChanges ?? []));
              }
            : undefined
        }
      />
    </div>
  );
};

export default TargetSimulation;
