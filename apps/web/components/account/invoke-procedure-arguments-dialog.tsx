"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import useScripts from "@/hooks/use-scripts";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { MIDEN_EXPLORER_URL } from "@/lib/constants";
import { formatProcedureExportPath } from "@/lib/utils";

const InvokeProcedureArgumentsDialog = () => {
  const {
    midenSdk: { AccountId },
  } = useMidenSdk();
  const {
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId: senderAccountId,
    invokeProcedureArgumentsDialogScript: script,
    invokeProcedureArgumentsDialogProcedure: procedureExport,
    closeInvokeProcedureArgumentsDialog,
    invokeProcedure,
  } = useScripts();
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState("");
  if (!script || !procedureExport) {
    return null;
  }
  const onClose = () => {
    setAccountId("");
    closeInvokeProcedureArgumentsDialog();
  };
  const isCopyCount =
    formatProcedureExportPath(procedureExport.path) === "copy_count";
  return (
    <Dialog
      open={invokeProcedureArgumentsDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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
            const formData = new FormData(event.currentTarget);
            setLoading(true);
            try {
              const transactionRecord = await invokeProcedure({
                senderAccountId,
                script,
                procedureExport,
                procedureInputs: procedureExport.signature.params.map(
                  (param, index) => {
                    switch (param) {
                      case "AccountId": {
                        const wasmAccountId = AccountId.fromHex(accountId);
                        return {
                          name: "counter_account_id",
                          type: param,
                          value: JSON.stringify({
                            prefix: wasmAccountId.prefix().toString(),
                            suffix: wasmAccountId.suffix().toString(),
                          }),
                        };
                      }
                      case "Word": {
                        return {
                          name: "proc_hash",
                          type: param,
                          value: formData.get("procHash")!.toString(),
                        };
                      }
                      default: {
                        return {
                          name: `param_${index}`,
                          type: param,
                          value: formData.get(`param_${index}`)!.toString(),
                        };
                      }
                    }
                  },
                ),
                foreignAccounts: accountId ? [accountId] : [],
              });
              toast("Transaction submitted.", {
                action: {
                  label: "View on MidenScan",
                  onClick: () =>
                    window.open(
                      `${MIDEN_EXPLORER_URL}/tx/${transactionRecord.id().toHex()}`,
                      "_blank",
                      "noopener noreferrer",
                    ),
                },
              });
              onClose();
            } catch (error) {
              console.error(error);
            }
            setLoading(false);
          }}
        >
          {isCopyCount ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3 col-span-2">
                <Label>counter_account_id</Label>
                <SelectAccountDropdownMenu
                  value={accountId}
                  onValueChange={setAccountId}
                />
              </div>
              <div className="grid gap-3 col-span-2">
                <Label htmlFor="procHash">get_count_proc_hash</Label>
                <Input id="procHash" name="procHash" required />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {procedureExport.signature.params.map((param, index) => (
                <div key={index} className="grid gap-3 col-span-2">
                  <Label htmlFor={`param_${index}`}>
                    Param #{index} ({param})
                  </Label>
                  <Input
                    id={`param_${index}`}
                    name={`param_${index}`}
                    required
                  />
                </div>
              ))}
            </div>
          )}
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="invoke-procedure-form"
            type="submit"
            disabled={loading || isCopyCount ? accountId === "" : false}
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
