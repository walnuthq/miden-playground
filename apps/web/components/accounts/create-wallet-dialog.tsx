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
import { Spinner } from "@workspace/ui/components/spinner";
import { Switch } from "@workspace/ui/components/switch";
import { useState } from "react";
import { toast } from "sonner";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";

// import useTutorials from "@/hooks/use-tutorials";

const CreateWalletDialog = () => {
  const {
    createWalletDialogOpen,
    newWallet,
    closeCreateWalletDialog,
    wallets,
  } = useAccounts();
  // const { tutorialId } = useTutorials();
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const onClose = () => {
    setIsPublic(true);
    closeCreateWalletDialog();
  };
  const walletDefaultName = `Wallet ${String.fromCharCode(65 + wallets.length)}`;
  return (
    <Dialog
      open={createWalletDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent data-modal="false" className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Create Wallet</DialogTitle>
          <DialogDescription>Create a new wallet.</DialogDescription>
        </DialogHeader>
        <form
          id="create-wallet-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setLoading(true);
            const wallet = await newWallet({
              name: formData.get("name")?.toString() ?? walletDefaultName,
              storageMode: formData.getAll("is-public").includes("on")
                ? "public"
                : "private",
            });
            setLoading(false);
            toast(`${wallet.name} has been created.`, {
              description: (
                <AccountAddress account={wallet} withTooltip={false} />
              ),
            });
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                // disabled={tutorialId !== ""}
                defaultValue={walletDefaultName}
                required
              />
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
                <Label>{isPublic ? "Public" : "Private"}</Label>
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button form="create-wallet-form" type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWalletDialog;
