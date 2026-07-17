"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import useAccounts from "@/hooks/use-accounts";
import AccountAddress from "@/components/lib/account-address";
import {
  type AccountStorageMode,
  accountStorageModes,
} from "@/lib/types/account";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import { defaultComponentIds } from "@/lib/types/default-components";
import SelectScriptsCombobox from "@/components/accounts/select-scripts-combobox";
import { formatProcedureExportPath } from "@/lib/utils/script";

const DeployAccountDialog = () => {
  const { deployAccountDialogOpen, deployAccount, closeDeployAccountDialog } =
    useAccounts();
  const { components } = useComponents();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  const [storageMode, setStorageMode] = useState<AccountStorageMode>("public");
  const [authComponentId, setAuthComponentId] = useState("auth-no-auth");
  const [componentId, setComponentId] = useState("");
  const [allowedNoteScriptIds, setAllowedNoteScriptIds] = useState<string[]>(
    [],
  );
  const [allowedTransactionScriptIds, setAllowedTransactionScriptIds] =
    useState<string[]>([]);
  const authComponent = components.find(({ id }) => id === authComponentId);
  const component = components.find(({ id }) => id === componentId);
  const onClose = () => {
    setStorageMode("public");
    setAuthComponentId("auth-no-auth");
    setComponentId("");
    setAllowedNoteScriptIds([]);
    setAllowedTransactionScriptIds([]);
    closeDeployAccountDialog();
  };
  const scriptIdToProcedure = (scriptId: string) => {
    const script = scripts.find(({ id }) => id === scriptId);
    const runProcedure = script?.procedureExports.find(
      ({ path }) => formatProcedureExportPath(path) === "run",
    );
    return runProcedure ? `${runProcedure.digest}:1` : "";
  };
  return (
    <Dialog
      open={deployAccountDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Deploy Account</DialogTitle>
          <DialogDescription>Deploy a new custom account.</DialogDescription>
        </DialogHeader>
        <form
          id="deploy-account-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!component || !authComponent) {
              return;
            }
            const formData = new FormData(event.currentTarget);
            const authComponentWithInitialValues =
              authComponent.id === "auth-network-account"
                ? {
                    ...authComponent,
                    storageSlots: authComponent.storageSlots.map(
                      (storageSlot) => ({
                        ...storageSlot,
                        value:
                          storageSlot.name ===
                          "miden::standards::auth::network_account::allowed_note_scripts"
                            ? allowedNoteScriptIds
                                .map(scriptIdToProcedure)
                                .join(",")
                            : allowedTransactionScriptIds
                                .map(scriptIdToProcedure)
                                .join(","),
                      }),
                    ),
                  }
                : {
                    ...authComponent,
                    storageSlots: authComponent.storageSlots.map(
                      (storageSlot) => ({
                        ...storageSlot,
                        value: formData.get(storageSlot.name)?.toString() ?? "",
                      }),
                    ),
                  };
            const componentWithInitialValues = {
              ...component,
              storageSlots: component.storageSlots.map((storageSlot) => ({
                ...storageSlot,
                value: formData.get(storageSlot.name)?.toString() ?? "",
              })),
            };
            setLoading(true);
            try {
              const account = await deployAccount({
                name: formData.get("name")?.toString() ?? "",
                storageMode,
                components: [
                  authComponentWithInitialValues,
                  componentWithInitialValues,
                ],
              });
              toast(`${account.name} has been deployed.`, {
                description: (
                  <AccountAddress account={account} withTooltip={false} />
                ),
              });
              onClose();
            } catch (error) {
              console.error(error);
              const { message } = error as { message: string };
              toast.error("Error while deploying Account Component.", {
                description: message,
              });
            }
            setLoading(false);
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="storage-mode">Storage mode</Label>
              <Select
                onValueChange={(storageMode) =>
                  setStorageMode(storageMode as AccountStorageMode)
                }
                value={storageMode}
              >
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Select storage mode…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(accountStorageModes).map(
                    (accountStorageMode) => (
                      <SelectItem
                        key={accountStorageMode}
                        value={accountStorageMode}
                      >
                        {
                          accountStorageModes[
                            accountStorageMode as AccountStorageMode
                          ]
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="auth-component">Auth Component</Label>
              <Select
                onValueChange={setAuthComponentId}
                value={authComponentId}
              >
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Select auth component…" />
                </SelectTrigger>
                <SelectContent>
                  {components
                    .filter(({ type }) => type === "authentication-component")
                    .map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="component">Account Component</Label>
              <Select onValueChange={setComponentId} value={componentId}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Select component…" />
                </SelectTrigger>
                <SelectContent>
                  {components
                    .filter(
                      ({ id, type }) =>
                        !defaultComponentIds.includes(id) &&
                        type === "account-component",
                    )
                    .map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {authComponentId === "auth-network-account" && (
              <>
                <div className="grid gap-3 col-span-2">
                  <Label htmlFor="allowed-note-scripts">
                    Allowed Note-scripts
                  </Label>
                  <SelectScriptsCombobox
                    scripts={scripts.filter(({ type }) => type === "note")}
                    value={allowedNoteScriptIds}
                    onValueChange={setAllowedNoteScriptIds}
                    placeholder="Select allowed note-scripts…"
                  />
                </div>
                <div className="grid gap-3 col-span-2">
                  <Label htmlFor="allowed-transaction-scripts">
                    Allowed Transaction-scripts
                  </Label>
                  <SelectScriptsCombobox
                    scripts={scripts.filter(({ type }) => type === "tx-script")}
                    value={allowedTransactionScriptIds}
                    onValueChange={setAllowedTransactionScriptIds}
                    placeholder="Select allowed transaction-scripts…"
                  />
                </div>
              </>
            )}
            {[
              ...(authComponent?.id !== "auth-network-account"
                ? (authComponent?.storageSlots ?? [])
                : []),
              ...(component?.storageSlots ?? []),
            ].map((storageSlot) => (
              <div key={storageSlot.name} className="grid gap-3 col-span-2">
                <Label htmlFor={storageSlot.name}>
                  <pre>{storageSlot.name}</pre>
                </Label>
                <Input
                  id={storageSlot.name}
                  name={storageSlot.name}
                  defaultValue={storageSlot.value}
                  required={storageSlot.type === "value"}
                />
              </div>
            ))}
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="deploy-account-form"
            type="submit"
            disabled={loading || !componentId}
          >
            {loading && <Spinner />}
            {loading ? "Deploying…" : "Deploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeployAccountDialog;
