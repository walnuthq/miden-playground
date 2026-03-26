"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
import { verifyAccountComponentFromSource } from "@/lib/api";
import { clientGetAccountById } from "@/lib/web-client";
import useWebClient from "@/hooks/use-web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { toBase64, fileListToPackageSources } from "@/lib/utils";
import useGlobalContext from "@/components/global-context/hook";
import { type PackageSource } from "@/lib/types/script";

const VerifyAccountComponentDialog = () => {
  const queryClient = useQueryClient();
  const { client } = useWebClient();
  const { midenSdk } = useMidenSdk();
  const { networkId } = useGlobalContext();
  const {
    accounts,
    verifyAccountComponentDialogOpen,
    verifyAccountComponentDialogAccountId: accountId,
    closeVerifyAccountComponentDialog,
  } = useAccounts();
  const [loading, setLoading] = useState(false);
  const [packageSource, setPackageSource] = useState<PackageSource | null>(
    null,
  );
  const onClose = () => {
    setPackageSource(null);
    closeVerifyAccountComponentDialog();
  };
  return (
    <Dialog
      open={verifyAccountComponentDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Verify Account Component</DialogTitle>
          <DialogDescription>
            Verify a custom account component.
          </DialogDescription>
        </DialogHeader>
        <form
          id="verify-account-component-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            const account = accounts.find(({ id }) => id === accountId);
            if (!account || !packageSource) {
              return;
            }
            const wasmAccount = await clientGetAccountById({
              client,
              accountId,
              midenSdk,
            });
            const { verified, error } = await verifyAccountComponentFromSource({
              networkId,
              accountId,
              identifier: account.identifier,
              account: toBase64(wasmAccount.serialize()),
              packageSource,
            });
            setLoading(false);
            if (verified) {
              toast.success("Account Component verified.");
              queryClient.invalidateQueries({
                queryKey: [
                  "verifiedAccountComponents",
                  networkId,
                  account.identifier,
                ],
              });
            } else {
              toast.error("Account Component couldn't be verified.", {
                description: error,
              });
            }
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="project-dir">Project Directory</Label>
              <Input
                id="project-dir"
                type="file"
                webkitdirectory=""
                onChange={async (event) => {
                  const { files } = event.target;
                  if (!files) {
                    return;
                  }
                  const packageSources = await fileListToPackageSources(files);
                  const packageSourcesList = Object.values(packageSources);
                  const [accountPackageSource = null] = packageSourcesList;
                  setPackageSource(accountPackageSource);
                }}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="verify-account-component-form"
            type="submit"
            disabled={loading || !packageSource}
          >
            {loading && <Spinner />}
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyAccountComponentDialog;
