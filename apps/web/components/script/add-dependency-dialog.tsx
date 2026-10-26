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
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { sleep } from "@/lib/utils";

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
        !defaultScriptIds
          .filter((defaultScriptId) => defaultScriptId !== "basic-wallet")
          .includes(id) &&
        !dependenciesIds.includes(id) &&
        ["account-component", "authentication-component"].includes(type) &&
        status === "compiled",
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
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent data-modal="false" className="sm:max-w-160">
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
              id: script.id,
              dependencies: [
                ...script.dependencies,
                {
                  id: dependency.id,
                  name: dependency.name,
                  type: dependency.type,
                  commitment: dependency.commitment,
                },
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
              <Select
                items={shownDependencies.map(({ id, name }) => ({
                  value: id,
                  label: name,
                }))}
                onValueChange={(value) => setDependencyId(value ?? "")}
                value={dependencyId || null}
              >
                <SelectTrigger
                  className="w-45"
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
          <DialogClose render={<Button variant="outline" />}>
            Cancel
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
