"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
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
  FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY,
} from "@/lib/constants";
import { parseAmount, formatAmount } from "@/lib/utils";

const CreateFaucetDialog = () => {
  const {
    createFaucetDialogOpen,
    newFaucet,
    closeCreateFaucetDialog,
    faucets,
  } = useAccounts();
  const [isPublic, setIsPublic] = useState(true);
  const [decimals, setDecimals] = useState(FUNGIBLE_FAUCET_DEFAULT_DECIMALS);
  const [loading, setLoading] = useState(false);
  const onClose = () => {
    setIsPublic(true);
    closeCreateFaucetDialog();
  };
  return (
    <Dialog
      open={createFaucetDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Fungible Faucet</DialogTitle>
          <DialogDescription>Create a new fungible faucet.</DialogDescription>
        </DialogHeader>
        <form
          id="create-faucet-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setLoading(true);
            const faucet = await newFaucet({
              name: formData.get("name")!.toString(),
              storageMode: formData.getAll("is-public").includes("on")
                ? "public"
                : "private",
              tokenSymbol: formData.get("token-symbol")!.toString(),
              decimals: Number(decimals),
              maxSupply: parseAmount(
                formData.get("max-supply")?.toString() ?? "0",
                decimals,
              ),
            });
            setLoading(false);
            toast(`${faucet.name} has been created.`, {
              description: (
                <AccountAddress account={faucet} withTooltip={false} />
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
                defaultValue={`Faucet ${String.fromCharCode(65 + faucets.length)}`}
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
                <Label htmlFor="is-public">
                  {isPublic ? "Public" : "Private"}
                </Label>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="token-symbol">Token symbol</Label>
              <Input
                id="token-symbol"
                name="token-symbol"
                defaultValue="MDN"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                name="decimals"
                type="number"
                min="1"
                max="12"
                value={decimals.toString()}
                onChange={(event) => setDecimals(Number(event.target.value))}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="max-supply">Max supply</Label>
              <Input
                id="max-supply"
                name="max-supply"
                type="number"
                step={formatAmount({ amount: "1", decimals }).replaceAll(
                  ",",
                  "",
                )}
                min={formatAmount({ amount: "1", decimals }).replaceAll(
                  ",",
                  "",
                )}
                defaultValue={FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY.toString()}
                required
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button form="create-faucet-form" type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFaucetDialog;
