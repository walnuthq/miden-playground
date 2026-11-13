import { useState } from "react";
import ProceduresList from "@/components/procedures/procedures-list";
import StorageSlotsEditor from "@/components/procedures/storage-slots-editor";
import SimulationResultDialog, {
  type SimulatedTransaction,
} from "@/components/script/simulate/simulation-result-dialog";
import useSimulation from "@/hooks/use-simulation";
import { storageChanges } from "@/lib/simulation/run";
import type { Script } from "@/lib/types/script";
import { formatProcedureExportPath } from "@/lib/utils/script";
import {
  applyStorageChanges,
  storageSlotsValid,
} from "@/lib/utils/storage-slots";

// Why the script can't be simulated now, or nothing when it can.
const notReady = ({ status, masp }: Script) =>
  status === "draft"
    ? "Compile the script to simulate it: its source changed since the last compile."
    : status === "error"
      ? "Fix the compile errors to simulate the script."
      : masp === ""
        ? "Compile the script to simulate it."
        : undefined;

const AccountComponentSimulation = ({
  script,
  onFailure,
}: {
  script: Script;
  onFailure: () => void;
}) => {
  const { storageSlots, setStorageSlots, invoke } = useSimulation(script);
  const [simulation, setSimulation] = useState<SimulatedTransaction>();
  const blocked = notReady(script);
  const slotsValid = storageSlotsValid(storageSlots);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {blocked ??
          "Procedures run locally on a throwaway account holding this component: nothing is submitted. Every run starts from the storage below, at nonce 0."}
      </p>
      {/* Side by side on a wide screen: the console is short. */}
      <div className="grid items-start gap-3 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xs font-medium">Storage</h3>
          <StorageSlotsEditor
            storageSlots={storageSlots}
            onChange={setStorageSlots}
            allowSlotEdits
            namePlaceholder={`${script.name.replace(/[^A-Za-z0-9_]/g, "_")}::component::field`}
          />
          {!slotsValid && (
            <p className="text-xs text-destructive">
              Storage values are felts or words (0x and 64 hex digits), with
              distinct slot names and map keys.
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xs font-medium">Procedures</h3>
          <ProceduresList
            idPrefix={`simulate-${script.id}`}
            procedureExports={script.procedureExports}
            disabled={blocked !== undefined || !slotsValid}
            onInvoke={async (procedureExport, args) => {
              const { result, account } = await invoke(procedureExport, args);
              if (!result.ok || !account) {
                // The error is in the log.
                onFailure();
                return { error: "Failed" };
              }
              if (result.executedTransaction) {
                setSimulation({
                  name: formatProcedureExportPath(procedureExport.path),
                  value: result.value,
                  executedTransaction: result.executedTransaction,
                  baseline: account,
                });
              }
              return { value: result.value };
            }}
          />
        </div>
      </div>
      <SimulationResultDialog
        simulation={simulation}
        onClose={() => setSimulation(undefined)}
        onApply={({ executedTransaction }) =>
          setStorageSlots(
            applyStorageChanges(
              storageSlots,
              storageChanges(executedTransaction),
            ),
          )
        }
      />
    </div>
  );
};

// The console's Simulate tab: runs the compiled script locally. `onFailure`
// shows the log, where a failed run's error is.
const SimulatePanel = ({
  script,
  onFailure,
}: {
  script: Script;
  onFailure: () => void;
}) =>
  script.type === "account-component" ? (
    <AccountComponentSimulation script={script} onFailure={onFailure} />
  ) : (
    <p className="text-xs text-muted-foreground">
      Only account components can be simulated for now.
    </p>
  );

export default SimulatePanel;
