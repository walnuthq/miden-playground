"use client";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
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

const InvokeProcedureArgumentsDialog = () => {
  const {
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId,
    invokeProcedureArgumentsDialogScriptId,
    invokeProcedureArgumentsDialogProcedure,
    scripts,
    closeInvokeProcedureArgumentsDialog,
    invokeProcedure,
  } = useScripts();
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState("");
  const script = scripts.find(
    ({ id }) => id === invokeProcedureArgumentsDialogScriptId
  );
  if (!script || !invokeProcedureArgumentsDialogProcedure) {
    return null;
  }
  const onClose = () => {
    setAccountId("");
    closeInvokeProcedureArgumentsDialog();
  };
  return (
    <Dialog
      open={invokeProcedureArgumentsDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-[640px] z-100"
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
            const { AccountId: WasmAccountId } = await import(
              "@demox-labs/miden-sdk"
            );
            const wasmAccountId = WasmAccountId.fromHex(accountId);
            // console.log(accountId);
            const transactionRecord = await invokeProcedure({
              senderAccountId: invokeProcedureArgumentsDialogSenderAccountId,
              scriptId: invokeProcedureArgumentsDialogScriptId,
              procedure: {
                ...invokeProcedureArgumentsDialogProcedure,
                inputs: invokeProcedureArgumentsDialogProcedure.inputs.map(
                  (input) => ({
                    ...input,
                    value:
                      input.name === "account_id"
                        ? JSON.stringify({
                            prefix: wasmAccountId.prefix().toString(),
                            suffix: wasmAccountId.suffix().toString(),
                          })
                        : formData.get("procHash")!.toString(),
                  })
                ),
                foreignAccounts: [accountId],
              },
            });
            setLoading(false);
            toast("Transaction submitted.", {
              action: {
                label: "View on MidenScan",
                onClick: () =>
                  window.open(
                    `https://testnet.midenscan.com/tx/${transactionRecord.id().toHex()}`,
                    "_blank",
                    "noopener noreferrer"
                  ),
              },
            });
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3 col-span-2">
              <Label>Account ID</Label>
              <SelectAccountDropdownMenu
                value={accountId}
                onValueChange={setAccountId}
              />
            </div>
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="procHash">Procedure Hash</Label>
              <Input
                id="procHash"
                name="procHash"
                defaultValue={
                  invokeProcedureArgumentsDialogProcedure.inputs.find(
                    ({ name }) => name === "proc_hash"
                  )?.value ?? ""
                }
                required
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="invoke-procedure-form"
            type="submit"
            disabled={loading || accountId === ""}
          >
            {loading && <RotateCw className="animate-spin" />}
            {loading ? "Invoking…" : "Invoke"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvokeProcedureArgumentsDialog;
