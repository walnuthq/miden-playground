"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
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
import useAccounts from "@/hooks/use-accounts";
import AccountAddress from "@/components/lib/account-address";
import useMultisig from "@/hooks/use-multisig";

const DeployMultisigDialog = () => {
  const { createMultisig } = useMultisig();
  const {
    // connectedWallet,
    deployMultisigDialogOpen,
    closeDeployMultisigDialog,
  } = useAccounts();
  const [loading, setLoading] = useState(false);
  const onClose = () => {
    closeDeployMultisigDialog();
  };
  return (
    <Dialog
      open={deployMultisigDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Deploy Guardian</DialogTitle>
          <DialogDescription>
            Deploy a new Miden Guardian wallet.
          </DialogDescription>
        </DialogHeader>
        <form
          id="deploy-multisig-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setLoading(true);
            const account = await createMultisig({
              name: formData.get("name")!.toString(),
              threshold: 1, //Number(formData.get("threshold")!.toString()),
            });
            setLoading(false);
            toast(`${account?.name} has been deployed.`, {
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
            {/* <div className="grid gap-3 col-span-2">
              <Label htmlFor="threshold">Signature threshold</Label>
              <Input
                id="threshold"
                name="threshold"
                required
                type="number"
                defaultValue={1}
                min={1}
                max={1}
              />
            </div>
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="signer">Signer 1 - You</Label>
              <Input
                id="signer"
                name="signer"
                required
                disabled
                value={connectedWallet?.name}
              />
              <Button type="button" variant="secondary" disabled>
                Add signer
              </Button>
            </div> */}
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button form="deploy-multisig-form" type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? "Deploying…" : "Deploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeployMultisigDialog;
