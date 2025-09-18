"use client";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
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
// import useGlobalContext from "@/components/global-context/hook";
import AccountAddress from "@/components/lib/account-address";

const ImportAccountDialog = () => {
  // const { networkId } = useGlobalContext();
  const {
    importAccountDialogOpen,
    importAccountByAddress,
    closeImportAccountDialog,
  } = useAccounts();
  const [loading, setLoading] = useState(false);
  return (
    <Dialog
      open={importAccountDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && closeImportAccountDialog()}
    >
      <DialogContent
        className="sm:max-w-[640px] z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Import Account</DialogTitle>
          <DialogDescription>Import account by address.</DialogDescription>
        </DialogHeader>
        <form
          id="import-account-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setLoading(true);
            const account = await importAccountByAddress({
              name: formData.get("name")?.toString() ?? "",
              address: formData.get("address")?.toString() ?? "",
            });
            setLoading(false);
            toast(`${account.name} has been imported.`, {
              description: (
                <AccountAddress account={account} withTooltip={false} />
              ),
            });
            closeImportAccountDialog();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                required
                //pattern={`^${networkId}`}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button form="import-account-form" type="submit" disabled={loading}>
            {loading && <RotateCw className="animate-spin" />}
            {loading ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAccountDialog;
