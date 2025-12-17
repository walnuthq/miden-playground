"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { Button } from "@workspace/ui/components/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@workspace/ui/components/select";
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
import { verifyAccountComponent } from "@/lib/api";
// import useComponents from "@/hooks/use-components";
// import { defaultComponentIds } from "@/lib/types/default-components";

const readFile = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      resolve(typeof fileReader.result === "string" ? fileReader.result : "");
    });
    fileReader.readAsText(file);
  });

const VerifyAccountComponentDialog = () => {
  const {
    verifyAccountComponentDialogOpen,
    verifyAccountComponentDialogAccountId: accountId,
    verifyAccountComponent: verify,
    closeVerifyAccountComponentDialog,
  } = useAccounts();
  // const { components } = useComponents();
  const [loading, setLoading] = useState(false);
  // const [componentId, setComponentId] = useState("");
  const [cargoToml, setCargoToml] = useState("");
  const [rust, setRust] = useState("");
  // const shownComponents = components.filter(
  //   ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  // );
  const onClose = () => {
    // setComponentId("");
    setCargoToml("");
    setRust("");
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
              cargoToml,
              rust,
              // componentId,
            });
            setLoading(false);
            if (verified) {
              toast.success("Account component verified.");
            } else {
              toast.error("Account component couldn't be verified.");
            }
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            {/*<div className="grid gap-3">
              <Label htmlFor="component">Account Component</Label>
              <Select onValueChange={setComponentId} value={componentId}>
                <SelectTrigger
                  className="w-[180px]"
                  disabled={shownComponents.length === 0}
                >
                  <SelectValue placeholder="Select component…" />
                </SelectTrigger>
                <SelectContent>
                  {shownComponents.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
            <div className="grid gap-3">
              <Label htmlFor="project-dir">Project Directory</Label>
              <Input
                id="project-dir"
                type="file"
                // multiple
                webkitdirectory=""
                onChange={async (event) => {
                  const { files } = event.target;
                  if (!files) {
                    return;
                  }
                  const filesArray = Array.from(files);
                  const cargoTomlFile = filesArray.find(
                    ({ name }) => name === "Cargo.toml"
                  );
                  const rustFile = filesArray.find(
                    ({ name }) => name === "lib.rs"
                  );
                  if (!cargoTomlFile || !rustFile) {
                    return;
                  }
                  const [cargoTomlContent, rustContent] = await Promise.all([
                    readFile(cargoTomlFile),
                    readFile(rustFile),
                  ]);
                  setCargoToml(cargoTomlContent);
                  setRust(rustContent);
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
            // disabled={loading || componentId === ""}
            disabled={loading || !cargoToml || !rust}
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
