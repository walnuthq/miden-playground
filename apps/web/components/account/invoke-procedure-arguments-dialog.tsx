"use client";
import { Fragment, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { AccountId as WasmAccountId } from "@miden-sdk/miden-sdk";
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
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import { midenExplorerUrl } from "@/lib/constants";
import { formatAmount } from "@/lib/utils/asset";
import type { ProcedureExport, MidenType } from "@/lib/types/script";
import { formatProcedureExportPath } from "@/lib/utils/script";
import useNetwork from "@/hooks/use-network";

const FeltField = ({ id }: { id: string }) => (
  <div className="grid gap-3 col-span-2">
    <Label htmlFor={id}>{id}</Label>
    <Input id={id} name={id} required />
  </div>
);

const WordField = ({ id }: { id: string }) => (
  <div className="grid gap-3 col-span-2">
    <Label htmlFor={id}>{id}</Label>
    <Input id={id} name={id} required />
  </div>
);

const AccountIdField = ({
  id,
  accountId,
  setAccountId,
}: {
  id: string;
  accountId: string;
  setAccountId: Dispatch<SetStateAction<string>>;
}) => (
  <div className="grid gap-3 col-span-2">
    <Label>{id}</Label>
    <SelectAccountDropdownMenu value={accountId} onValueChange={setAccountId} />
  </div>
);

const FaucetIdField = ({
  id,
  faucetId,
  setFaucetId,
}: {
  id: string;
  faucetId: string;
  setFaucetId: Dispatch<SetStateAction<string>>;
}) => (
  <div className="grid gap-3 col-span-2">
    <Label>{id}</Label>
    <SelectAccountDropdownMenu
      value={faucetId}
      onValueChange={setFaucetId}
      selectFaucets
      showFaucetsAsAssets
    />
  </div>
);

const AssetField = ({
  id,
  faucetId,
  setFaucetId,
}: {
  id: string;
  faucetId: string;
  setFaucetId: Dispatch<SetStateAction<string>>;
}) => {
  const { faucets } = useAccounts();
  const faucetAccount = faucets.find(({ id }) => id === faucetId);
  return (
    <>
      <div className="grid gap-3">
        <Label>{id} faucet</Label>
        <SelectAccountDropdownMenu
          value={faucetId}
          onValueChange={setFaucetId}
          selectFaucets
          showFaucetsAsAssets
        />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="amount">{id} amount</Label>
        <Input
          id={`${id}-amount`}
          name={`${id}-amount`}
          type="number"
          step={formatAmount({
            amount: "1",
            decimals: faucetAccount?.decimals,
          }).replaceAll(",", "")}
          min={formatAmount({
            amount: "1",
            decimals: faucetAccount?.decimals,
          }).replaceAll(",", "")}
          required
        />
      </div>
    </>
  );
};

const getParamsWithNames = (
  procedureExport: ProcedureExport,
): { name: string; type: MidenType }[] => {
  const path = formatProcedureExportPath(procedureExport.path);
  return path === "copy_count"
    ? [
        { name: "counter_contract_id", type: "AccountId" },
        { name: "get_count_proc_hash", type: "Word" },
      ]
    : path === "get-balance"
      ? [
          { name: "depositor", type: "AccountId" },
          { name: "faucet", type: "FaucetId" },
        ]
      : path === "deposit"
        ? [
            { name: "depositor", type: "AccountId" },
            { name: "asset", type: "Asset" },
          ]
        : procedureExport.signature.params.map((param, index) => ({
            name: `param_${index}`,
            type: param,
          }));
};

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
  const [accountId, setAccountId] = useState("");
  const [faucetId, setFaucetId] = useState("");
  if (!script || !procedureExport) {
    return null;
  }
  const onClose = () => {
    setAccountId("");
    setFaucetId("");
    closeInvokeProcedureArgumentsDialog();
  };
  const paramsWithNames = getParamsWithNames(procedureExport);
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
            const procedureInputs = paramsWithNames.map(({ name, type }) => {
              switch (type) {
                case "AccountId": {
                  const wasmAccountId = WasmAccountId.fromHex(accountId);
                  return {
                    name,
                    type,
                    value: JSON.stringify({
                      prefix: wasmAccountId.prefix().toString(),
                      suffix: wasmAccountId.suffix().toString(),
                    }),
                  };
                }
                case "FaucetId": {
                  const wasmAccountId = WasmAccountId.fromHex(faucetId);
                  return {
                    name,
                    type,
                    value: JSON.stringify({
                      prefix: wasmAccountId.prefix().toString(),
                      suffix: wasmAccountId.suffix().toString(),
                    }),
                  };
                }
                case "Asset": {
                  const wasmAccountId = WasmAccountId.fromHex(faucetId);
                  return {
                    name,
                    type,
                    value: JSON.stringify({
                      prefix: wasmAccountId.prefix().toString(),
                      suffix: wasmAccountId.suffix().toString(),
                      amount: formData.get(`${name}-amount`)!.toString(),
                    }),
                  };
                }
                default: {
                  return {
                    name,
                    type,
                    value: formData.get(name)!.toString(),
                  };
                }
              }
            });
            if (procedureExport.readOnly) {
              try {
                const word = await readWord({
                  accountId: senderAccountId,
                  script,
                  procedureExport,
                  procedureInputs,
                });
                if (procedureExport.signature.results.length === 1) {
                  const [felt = 0n] = word.toU64s();
                  setReadOnlyProcedureResult({
                    digest: procedureExport.digest,
                    result: felt.toString(),
                  });
                } else if (procedureExport.signature.results.length === 4) {
                  setReadOnlyProcedureResult({
                    digest: procedureExport.digest,
                    result: word.toHex(),
                  });
                }
              } catch (error) {
                console.error(error);
                setReadOnlyProcedureResult({
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
                  foreignAccounts: accountId ? [accountId] : [],
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
              }
            }
            setLoading(false);
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            {paramsWithNames.map(({ name, type }) => (
              <Fragment key={name}>
                {type === "Felt" && <FeltField id={name} />}
                {type === "Word" && <WordField id={name} />}
                {type === "AccountId" && (
                  <AccountIdField
                    id={name}
                    accountId={accountId}
                    setAccountId={setAccountId}
                  />
                )}
                {type === "FaucetId" && (
                  <FaucetIdField
                    id={name}
                    faucetId={faucetId}
                    setFaucetId={setFaucetId}
                  />
                )}
                {type === "Asset" && (
                  <AssetField
                    id={name}
                    faucetId={faucetId}
                    setFaucetId={setFaucetId}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="invoke-procedure-form"
            type="submit"
            disabled={
              loading ||
              (procedureExport.signature.params.includes("AccountId") &&
                !accountId) ||
              (procedureExport.signature.params.includes("FaucetId") &&
                !faucetId) ||
              (procedureExport.signature.params.includes("Asset") && !faucetId)
            }
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
