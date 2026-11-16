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
import { Spinner } from "@workspace/ui/components/spinner";
import { useState } from "react";
import { toast } from "sonner";
import ProcedureArgumentsForm from "@/components/procedures/procedure-arguments-form";
import useNetwork from "@/hooks/use-network";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import { midenExplorerUrl } from "@/lib/constants";
import {
  decodeProcedureResult,
  encodeProcedureArguments,
  type ProcedureArguments,
  procedureArgumentsReady,
  procedureParams,
} from "@/lib/utils/procedure-inputs";
import { accountIdParts } from "@/lib/web-client";

// The arguments of a procedure invoked from an account's Components tab. An
// `AccountId` argument is a plain argument: no foreign account is declared.
// When the procedure reaches a public account through FPI, the client fetches
// that account from the node as it executes.
const InvokeProcedureArgumentsDialog = () => {
  const { readWord } = useTransactions();
  const { networkId } = useNetwork();
  const {
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId: senderAccountId,
    invokeProcedureArgumentsDialogScript: script,
    invokeProcedureArgumentsDialogProcedure: procedureExport,
    closeInvokeProcedureArgumentsDialog,
    invokeProcedure,
    setReadOnlyProcedureResult,
  } = useScripts();
  const [loading, setLoading] = useState(false);
  const [args, setArgs] = useState<ProcedureArguments>({});
  if (!script || !procedureExport) {
    return null;
  }
  const onClose = () => {
    setArgs({});
    closeInvokeProcedureArgumentsDialog();
  };
  const params = procedureParams(procedureExport);
  const ready = procedureArgumentsReady(params, args);
  return (
    <Dialog
      open={invokeProcedureArgumentsDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent data-modal="false" className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Invoke Procedure</DialogTitle>
          <DialogDescription>
            Invoke a procedure with custom arguments.
          </DialogDescription>
        </DialogHeader>
        <form
          id="invoke-procedure-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!ready) {
              return;
            }
            setLoading(true);
            const procedureInputs = encodeProcedureArguments({
              params,
              args,
              accountIdParts,
            });
            if (procedureExport.readOnly) {
              try {
                const word = await readWord({
                  accountId: senderAccountId,
                  script,
                  procedureExport,
                  procedureInputs,
                });
                setReadOnlyProcedureResult({
                  accountId: senderAccountId,
                  digest: procedureExport.digest,
                  result: decodeProcedureResult(
                    procedureExport.signature,
                    Array.from(word.toU64s()),
                  ),
                });
              } catch (error) {
                console.error(error);
                setReadOnlyProcedureResult({
                  accountId: senderAccountId,
                  digest: procedureExport.digest,
                  result: "ERROR",
                });
              }
              onClose();
            } else {
              try {
                const transactionRecord = await invokeProcedure({
                  senderAccountId,
                  script,
                  procedureExport,
                  procedureInputs,
                });
                toast("Transaction submitted.", {
                  action: {
                    label: "View on MidenScan",
                    onClick: () =>
                      window.open(
                        `${midenExplorerUrl(networkId)}/tx/${transactionRecord.id().toHex()}`,
                        "_blank",
                        "noreferrer",
                      ),
                  },
                });
                onClose();
              } catch (error) {
                console.error(error);
                toast.error("Transaction failed.", {
                  description:
                    error instanceof Error ? error.message : String(error),
                });
              }
            }
            setLoading(false);
          }}
        >
          <ProcedureArgumentsForm
            idPrefix="invoke-procedure"
            params={params}
            value={args}
            onChange={setArgs}
            disabled={loading}
          />
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            form="invoke-procedure-form"
            type="submit"
            disabled={loading || !ready}
          >
            {loading && <Spinner />}
            {loading ? "Invoking…" : "Invoke"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvokeProcedureArgumentsDialog;
