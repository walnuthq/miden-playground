import { useState } from "react";
import ProceduresList from "@/components/procedures/procedures-list";
import StorageSlotsEditor from "@/components/procedures/storage-slots-editor";
import DependencyAccounts, {
  InvalidSlots,
  slotNamePlaceholder,
} from "@/components/script/simulate/dependency-accounts";
import { notReady } from "@/components/script/simulate/not-ready";
import SimulationResultDialog, {
  type SimulatedTransaction,
} from "@/components/script/simulate/simulation-result-dialog";
import TargetSimulation from "@/components/script/simulate/target-simulation";
import useSimulation from "@/hooks/use-simulation";
import { simulationBlockedReason } from "@/lib/simulation/blocked";
import { storageChanges } from "@/lib/simulation/run";
import type { Script } from "@/lib/types/script";
import { formatProcedureExportPath } from "@/lib/utils/script";
import { storageSlotDescriptions } from "@/lib/utils/storage-schema";
import {
  applyStorageChanges,
  storageSlotsValid,
} from "@/lib/utils/storage-slots";

const AccountComponentSimulation = ({
  script,
  onFailure,
}: {
  script: Script;
  onFailure: () => void;
}) => {
  const {
    storageSlots,
    setStorageSlots,
    foreignAccounts,
    unresolvedForeignAccounts,
    foreignAccountsStatus,
    foreignAccountsReady,
    simulatedAccounts,
    invoke,
  } = useSimulation(script);
  const [simulation, setSimulation] = useState<SimulatedTransaction>();
  const blocked = notReady(script);
  const slotsValid =
    storageSlotsValid(storageSlots) &&
    foreignAccounts.every((foreignAccount) =>
      storageSlotsValid(foreignAccount.storageSlots),
    );
  const hasForeignAccounts =
    foreignAccounts.length > 0 || unresolvedForeignAccounts.length > 0;
  // With the package's storage schema, its slots are the ones there are.
  const schema = script.metadata?.storage;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {blocked ??
          `Procedures run locally on a throwaway account holding this component: nothing is submitted. Every run starts from the storage below, at nonce 0.${hasForeignAccounts ? " Procedures that call another account run against the simulated foreign accounts below: pick one as the account argument." : ""}`}
      </p>
      {/* Side by side on a wide screen: the console is short. */}
      <div className="grid items-start gap-3 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xs font-medium">Storage</h3>
          <StorageSlotsEditor
            storageSlots={storageSlots}
            onChange={setStorageSlots}
            allowSlotEdits={!schema}
            descriptions={schema && storageSlotDescriptions(schema)}
            namePlaceholder={slotNamePlaceholder(script.name)}
          />
          {!storageSlotsValid(storageSlots) && <InvalidSlots />}
          {hasForeignAccounts && (
            <DependencyAccounts
              title="Foreign accounts"
              labelPrefix="Foreign account"
              {...(script.readOnly
                ? {
                    stale: "changed since this script was compiled.",
                    missing: "its compiled package isn't in the workspace.",
                  }
                : {
                    stale:
                      "changed since this script was compiled. Compile this script again to simulate calls to it.",
                    missing:
                      "its compiled package isn't in the workspace. Compile it, then this script, to simulate calls to it.",
                  })}
              accounts={foreignAccounts}
              unresolved={unresolvedForeignAccounts}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xs font-medium">Procedures</h3>
          <ProceduresList
            idPrefix={`simulate-${script.id}`}
            procedureExports={script.procedureExports}
            disabled={
              blocked !== undefined || !slotsValid || !foreignAccountsReady
            }
            blockedReason={(procedureExport) =>
              simulationBlockedReason(
                procedureExport,
                foreignAccountsStatus,
                script.readOnly,
              )
            }
            simulatedAccounts={simulatedAccounts}
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
                  throwaway: true,
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
  ) : script.type === "note" || script.type === "transaction-script" ? (
    <TargetSimulation script={script} onFailure={onFailure} />
  ) : (
    <p className="text-xs text-muted-foreground">
      Only account components, note scripts and transaction scripts can be
      simulated.
    </p>
  );

export default SimulatePanel;
