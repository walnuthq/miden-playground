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
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Spinner } from "@workspace/ui/components/spinner";
import { useState } from "react";
import { toast } from "sonner";
import SelectScriptsCombobox from "@/components/accounts/select-scripts-combobox";
import AccountAddress from "@/components/lib/account-address";
import StorageSlotsEditor from "@/components/procedures/storage-slots-editor";
import {
  InvalidSlots,
  slotNamePlaceholder,
} from "@/components/script/simulate/dependency-accounts";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useScripts from "@/hooks/use-scripts";
import {
  type AccountStorageMode,
  accountStorageModes,
} from "@/lib/types/account";
import type { Script } from "@/lib/types/script";
import type { StorageSlot } from "@/lib/types/storage-slot";
import {
  authComponents,
  componentTitle,
  deployableAccountComponents,
} from "@/lib/utils/account-components";
import { entryPointExport } from "@/lib/utils/script";
import {
  initialSlotsOf,
  storageSlotDescriptions,
} from "@/lib/utils/storage-schema";
import { storageSlotsValid } from "@/lib/utils/storage-slots";

const NETWORK_ACCOUNT_ID = "auth-network-account";
const ALLOWED_NOTE_SCRIPTS =
  "miden::standards::auth::network_account::allowed_note_scripts";
const ALLOWED_TX_SCRIPTS =
  "miden::standards::auth::network_account::allowed_tx_scripts";

// A component's slots at their initial values: its schema's, else the names
// its source declares, else none (the user adds them).
const initialSlots = (script: Script | undefined) =>
  initialSlotsOf(script?.metadata) ?? [];

// The storage of a component the account is deployed with, edited in place:
// its schema's slots, or, when the script has none, the names its source
// declares and slots added by hand.
const ComponentStorage = ({
  label,
  script,
  storageSlots,
  onChange,
  disabled,
}: {
  label: string;
  script: Script;
  storageSlots: StorageSlot[];
  onChange: (storageSlots: StorageSlot[]) => void;
  disabled: boolean;
}) => {
  const schema = script.metadata?.storage;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="text-sm font-medium">{label}</h3>
      {!schema &&
        (script.metadata?.slotNames ? (
          <p className="text-xs text-muted-foreground">
            This script has no storage layout: the slots below are the names its
            code declares with <code>{'word("…")'}</code>. Set each one to a
            value or a map, and remove any that isn't a storage slot.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            This script has no storage layout to list its slots: add the slots
            its code reads and writes below, by the names it gives them in{" "}
            <code>{'word("…")'}</code>.
          </p>
        ))}
      <StorageSlotsEditor
        storageSlots={storageSlots}
        onChange={onChange}
        disabled={disabled}
        allowSlotEdits={!schema}
        descriptions={schema && storageSlotDescriptions(schema)}
        namePlaceholder={slotNamePlaceholder(script.name)}
      />
    </div>
  );
};

const DeployAccountDialog = () => {
  const { deployAccountDialogOpen, deployAccount, closeDeployAccountDialog } =
    useAccounts();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  const [storageMode, setStorageMode] = useState<AccountStorageMode>("public");
  const [authScriptId, setAuthScriptId] = useState("auth-no-auth");
  const [authStorageSlots, setAuthStorageSlots] = useState<StorageSlot[]>([]);
  const [scriptId, setScriptId] = useState("");
  const [storageSlots, setStorageSlots] = useState<StorageSlot[]>([]);
  const [allowedNoteScriptIds, setAllowedNoteScriptIds] = useState<string[]>(
    [],
  );
  const [allowedTransactionScriptIds, setAllowedTransactionScriptIds] =
    useState<string[]>([]);
  const { networkId } = useNetwork();
  // No network transaction builder runs on the MockChain: a network account's
  // notes would never be consumed.
  const authScripts = authComponents(scripts).filter(
    ({ id }) => networkId !== "mmck" || id !== NETWORK_ACCOUNT_ID,
  );
  const accountScripts = deployableAccountComponents(scripts);
  const authScript = authScripts.find(({ id }) => id === authScriptId);
  const script = accountScripts.find(({ id }) => id === scriptId);
  const isNetworkAccount = authScriptId === NETWORK_ACCOUNT_ID;
  // Network Account's slots come from its two script pickers. No Auth has
  // none.
  const showAuthStorage =
    !!authScript &&
    !isNetworkAccount &&
    (!authScript.metadata?.storage ||
      authScript.metadata.storage.slots.length > 0);
  const valid =
    storageSlotsValid(storageSlots) &&
    (!showAuthStorage || storageSlotsValid(authStorageSlots));
  const onClose = () => {
    setStorageMode("public");
    setAuthScriptId("auth-no-auth");
    setAuthStorageSlots([]);
    setScriptId("");
    setStorageSlots([]);
    setAllowedNoteScriptIds([]);
    setAllowedTransactionScriptIds([]);
    closeDeployAccountDialog();
  };
  // An allowed script's entry point, as the allowlist records it.
  const scriptIdToProcedure = (scriptId: string) => {
    const script = scripts.find(({ id }) => id === scriptId);
    const entryPoint = script ? entryPointExport(script) : undefined;
    return entryPoint ? `${entryPoint.digest}:1` : "";
  };
  return (
    <Dialog
      open={deployAccountDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        data-modal="false"
        className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-160"
      >
        <DialogHeader>
          <DialogTitle>Deploy Account</DialogTitle>
          <DialogDescription>Deploy a new custom account.</DialogDescription>
        </DialogHeader>
        {/* The storage editors sit outside the form: the one that adds slots
            has a form of its own, whose submit would bubble to this one. */}
        <form
          id="deploy-account-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!script || !authScript || !valid) {
              return;
            }
            const formData = new FormData(event.currentTarget);
            const authComponent = {
              scriptId: authScript.id,
              storageSlots: isNetworkAccount
                ? [
                    {
                      name: ALLOWED_NOTE_SCRIPTS,
                      type: "map" as const,
                      value: allowedNoteScriptIds
                        .map(scriptIdToProcedure)
                        .join(","),
                    },
                    {
                      name: ALLOWED_TX_SCRIPTS,
                      type: "map" as const,
                      value: allowedTransactionScriptIds
                        .map(scriptIdToProcedure)
                        .join(","),
                    },
                  ]
                : showAuthStorage
                  ? authStorageSlots
                  : [],
            };
            setLoading(true);
            try {
              const account = await deployAccount({
                name: formData.get("name")?.toString() ?? "",
                storageMode,
                components: [
                  authComponent,
                  { scriptId: script.id, storageSlots },
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="storage-mode">Storage mode</Label>
              <Select
                items={accountStorageModes}
                onValueChange={(storageMode) =>
                  setStorageMode(storageMode as AccountStorageMode)
                }
                value={storageMode}
              >
                <SelectTrigger id="storage-mode" className="w-full sm:w-45">
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
                items={authScripts.map((script) => ({
                  value: script.id,
                  label: componentTitle(script),
                }))}
                onValueChange={(value) => {
                  setAuthScriptId(value ?? "");
                  setAuthStorageSlots(
                    initialSlots(authScripts.find(({ id }) => id === value)),
                  );
                }}
                value={authScriptId || null}
              >
                <SelectTrigger id="auth-component" className="w-full sm:w-45">
                  <SelectValue placeholder="Select auth component…" />
                </SelectTrigger>
                <SelectContent>
                  {authScripts.map((script) => (
                    <SelectItem key={script.id} value={script.id}>
                      {componentTitle(script)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="component">Account Component</Label>
              <Select
                items={accountScripts.map((script) => ({
                  value: script.id,
                  label: componentTitle(script),
                }))}
                onValueChange={(value) => {
                  setScriptId(value ?? "");
                  setStorageSlots(
                    initialSlots(accountScripts.find(({ id }) => id === value)),
                  );
                }}
                value={scriptId || null}
              >
                <SelectTrigger id="component" className="w-full sm:w-45">
                  <SelectValue placeholder="Select component…" />
                </SelectTrigger>
                <SelectContent>
                  {accountScripts.map((script) => (
                    <SelectItem key={script.id} value={script.id}>
                      {componentTitle(script)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isNetworkAccount && (
              <>
                <div className="grid gap-3 sm:col-span-2">
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
                <div className="grid gap-3 sm:col-span-2">
                  <Label htmlFor="allowed-transaction-scripts">
                    Allowed Transaction-scripts
                  </Label>
                  <SelectScriptsCombobox
                    scripts={scripts.filter(
                      ({ type }) => type === "transaction-script",
                    )}
                    value={allowedTransactionScriptIds}
                    onValueChange={setAllowedTransactionScriptIds}
                    placeholder="Select allowed transaction-scripts…"
                  />
                </div>
              </>
            )}
          </div>
        </form>
        {showAuthStorage && (
          <ComponentStorage
            label={`${componentTitle(authScript)} storage`}
            script={authScript}
            storageSlots={authStorageSlots}
            onChange={setAuthStorageSlots}
            disabled={loading}
          />
        )}
        {script && (
          <ComponentStorage
            label={`${componentTitle(script)} storage`}
            script={script}
            storageSlots={storageSlots}
            onChange={setStorageSlots}
            disabled={loading}
          />
        )}
        {!valid && <InvalidSlots />}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            form="deploy-account-form"
            type="submit"
            disabled={loading || !script || !valid}
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
