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
import { Label } from "@workspace/ui/components/label";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import defaultComponents from "@/lib/types/default-components";

const VerifyAccountComponentDialog = () => {
  const {
    verifyAccountComponentDialogOpen,
    verifyAccountComponentDialogAccountId: accountId,
    verifyAccountComponent,
    closeVerifyAccountComponentDialog,
  } = useAccounts();
  const { components } = useComponents();
  const [loading, setLoading] = useState(false);
  const [componentId, setComponentId] = useState("");
  const defaultComponentIds = defaultComponents.map(({ id }) => id);
  const onClose = () => {
    setComponentId("");
    closeVerifyAccountComponentDialog();
  };
  return (
    <Dialog
      open={verifyAccountComponentDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-[640px] z-100"
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
            const verified = await verifyAccountComponent({
              accountId,
              componentId,
            });
            setLoading(false);
            if (verified) {
              toast.success("Account component verified");
            } else {
              toast.error("Account component couldn't be verified");
            }
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="component">Account Component</Label>
              <Select onValueChange={setComponentId} value={componentId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select component…" />
                </SelectTrigger>
                <SelectContent>
                  {components
                    .filter(
                      ({ id, type }) =>
                        !defaultComponentIds.includes(id) && type === "account"
                    )
                    .map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
            disabled={loading || componentId === ""}
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
