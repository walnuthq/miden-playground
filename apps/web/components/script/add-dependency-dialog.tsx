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
import useScripts from "@/hooks/use-scripts";
import { sleep } from "@/lib/utils";
import { defaultScriptIds } from "@/lib/types/default-scripts";

const AddDependencyDialog = () => {
  const {
    scripts,
    addDependencyDialogOpen,
    addDependencyDialogScriptId: scriptId,
    updateScript,
    closeAddDependencyDialog,
  } = useScripts();
  const [loading, setLoading] = useState(false);
  const [dependencyId, setDependencyId] = useState("");
  const script = scripts.find(({ id }) => id === scriptId);
  const dependenciesIds = script?.dependencies.map(({ id }) => id) ?? [];
  const shownDependencies = scripts
    .filter(
      ({ id, type, status }) =>
        id !== scriptId &&
        !defaultScriptIds.includes(id) &&
        !dependenciesIds.includes(id) &&
        ["authentication-component", "account"].includes(type) &&
        status === "compiled"
    )
    .toReversed();
  const onClose = () => {
    setDependencyId("");
    closeAddDependencyDialog();
  };
  return (
    <Dialog
      open={addDependencyDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-[640px] z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Dependency</DialogTitle>
          <DialogDescription>
            Add a dependency to your script.
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-dependency-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const dependency = scripts.find(({ id }) => id === dependencyId);
            if (!script || !dependency) {
              return;
            }
            setLoading(true);
            updateScript({
              ...script,
              dependencies: [
                ...script.dependencies,
                { id: dependency.id, name: dependency.name, digest: "" },
              ],
            });
            await sleep(400);
            setLoading(false);
            toast("Dependency added.");
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="dependency">Dependency</Label>
              <Select onValueChange={setDependencyId} value={dependencyId}>
                <SelectTrigger
                  className="w-[180px]"
                  disabled={shownDependencies.length === 0}
                >
                  <SelectValue placeholder="Select component…" />
                </SelectTrigger>
                <SelectContent>
                  {shownDependencies.map(({ id, name }) => (
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
            form="add-dependency-form"
            type="submit"
            disabled={loading || dependencyId === ""}
          >
            {loading && <Spinner />}
            {loading ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDependencyDialog;
