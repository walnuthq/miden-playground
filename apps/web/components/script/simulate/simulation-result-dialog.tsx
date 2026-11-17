import type { ExecutedTransaction as WasmExecutedTransactionType } from "@miden-sdk/miden-sdk";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import type { ReactNode } from "react";
import type { FaucetLabel } from "@/components/lib/fungible-assets-table";
import TransactionEffects, {
  type TransactionBaseline,
} from "@/components/lib/transaction-effects";

export type SimulatedTransaction = {
  // What ran: a procedure's name.
  name: string;
  // What it returned, empty when nothing.
  value: string;
  executedTransaction: WasmExecutedTransactionType;
  // The account's state the transaction ran from.
  baseline: TransactionBaseline;
  // Whether it ran on a throwaway account, which the effects then name
  // instead of showing an address.
  throwaway: boolean;
  // Names the assets of faucets the app doesn't know, by faucet id: the
  // simulated assets, issued by faucets of the mock client.
  faucetLabels?: Record<string, FaucetLabel>;
  // The final balances of the vault's simulated assets the transaction
  // changed, by stand-in: what "Apply to state" sets the vault rows to.
  vaultChanges?: { faucetId: string; amount: bigint }[];
};

// A simulated transaction's effects: the transaction dialog's preview without
// its Submit. `onApply` carries the resulting storage and vault over to the
// next runs. `title` and `description` replace the simulation's, for another
// kind of run (the Create Note dialog's consumption preview).
const SimulationResultDialog = ({
  simulation,
  onClose,
  onApply,
  title,
  description,
}: {
  simulation?: SimulatedTransaction;
  onClose: () => void;
  onApply?: (simulation: SimulatedTransaction) => void;
  title?: ReactNode;
  description?: ReactNode;
}) => (
  <Dialog
    open={simulation !== undefined}
    onOpenChange={(open) => !open && onClose()}
  >
    {/* A column that can shrink to the dialog's width, for the effects' wide
        tables (docs/claude/phone-layout.md). */}
    <DialogContent className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-160">
      <DialogHeader>
        <DialogTitle>
          {title ?? <>Simulation of {simulation?.name}</>}
        </DialogTitle>
        <DialogDescription>
          {description ?? (
            <>
              Nothing was submitted: the transaction ran locally
              {simulation?.throwaway ? ", on a throwaway account" : ""}.
            </>
          )}
        </DialogDescription>
      </DialogHeader>
      {simulation && (
        <>
          {simulation.value && (
            <p className="text-sm">
              <strong>Returned:</strong>{" "}
              <code className="break-all">{simulation.value}</code>
            </p>
          )}
          <TransactionEffects
            executedTransaction={simulation.executedTransaction}
            baseline={simulation.baseline}
            accountLabel={
              simulation.throwaway ? "simulated account" : undefined
            }
            faucetLabels={simulation.faucetLabels}
          />
        </>
      )}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        {simulation && onApply && (
          <Button
            onClick={() => {
              onApply(simulation);
              onClose();
            }}
          >
            Apply to state
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default SimulationResultDialog;
