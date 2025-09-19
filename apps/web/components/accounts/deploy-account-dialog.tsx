"use client";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
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
import { type AccountType, accountTypes } from "@/lib/types/account";
import useComponents from "@/hooks/use-components";

const DeployAccountDialog = () => {
  const { deployAccountDialogOpen, deployAccount, closeDeployAccountDialog } =
    useAccounts();
  const { components } = useComponents();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(
    "regular-account-updatable-code"
  );
  const [isPublic, setIsPublic] = useState(true);
  const [authComponentId, setAuthComponentId] = useState("no-auth");
  const [componentId, setComponentId] = useState("");
  const authComponent = components.find(({ id }) => id === authComponentId);
  const component = components.find(({ id }) => id === componentId);
  const onClose = () => {
    setAccountType("regular-account-updatable-code");
    setIsPublic(true);
    setAuthComponentId("no-auth");
    setComponentId("");
    closeDeployAccountDialog();
  };
  return (
    <Dialog
      open={deployAccountDialogOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[640px] z-100">
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
            const componentWithInitialValues = {
              ...component,
              storageSlots: component.storageSlots.map(
                (storageSlot, index) => ({
                  ...storageSlot,
                  value: formData.get(`slot-${index}`)?.toString() ?? "",
                })
              ),
            };
            setLoading(true);
            const account = await deployAccount({
              name: formData.get("name")?.toString() ?? "",
              accountType,
              storageMode: isPublic ? "public" : "private",
              components: [authComponent, componentWithInitialValues],
            });
            setLoading(false);
            toast(`${account.name} has been deployed.`, {
              description: (
                <AccountAddress account={account} withTooltip={false} />
              ),
            });
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="type">Type</Label>
              <Select
                onValueChange={(accountType) =>
                  setAccountType(accountType as AccountType)
                }
                value={accountType.toString()}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(accountTypes).map((accountType) => (
                    <SelectItem key={accountType} value={accountType}>
                      {accountTypes[accountType as AccountType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="is-public">Storage mode</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="is-public"
                  name="is-public"
                  defaultChecked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked)}
                />
                <Label htmlFor="is-public">
                  {isPublic ? "Public" : "Private"}
                </Label>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="auth-component">Auth Component</Label>
              <Select
                onValueChange={setAuthComponentId}
                value={authComponentId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select auth component…" />
                </SelectTrigger>
                <SelectContent>
                  {components
                    .filter(({ type }) => type === "auth")
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select component…" />
                </SelectTrigger>
                <SelectContent>
                  {components
                    .filter(({ type }) => type === "account")
                    .map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {component?.storageSlots.map((storageSlot, index) => {
              return (
                <div key={index} className="grid gap-3 col-span-2">
                  <Label htmlFor={`slot-${index}`}>{storageSlot.name}</Label>
                  <Input
                    id={`slot-${index}`}
                    name={`slot-${index}`}
                    defaultValue={storageSlot.value}
                    required
                  />
                </div>
              );
            })}
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
            {loading && <RotateCw className="animate-spin" />}
            {loading ? "Deploying…" : "Deploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeployAccountDialog;
