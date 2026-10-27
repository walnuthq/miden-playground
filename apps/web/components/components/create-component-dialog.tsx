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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Spinner } from "@workspace/ui/components/spinner";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import { type ComponentType, componentTypes } from "@/lib/types/component";

const CreateComponentDialog = () => {
  const navigate = useNavigate();
  const {
    components,
    createComponentDialogOpen,
    closeCreateComponentDialog,
    newComponent,
  } = useComponents();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  const [scriptId, setScriptId] = useState("");
  const [componentType, setComponentType] =
    useState<ComponentType>("account-component");
  const componentScriptIds = components.map(({ scriptId }) => scriptId);
  const shownScripts = scripts.filter(
    ({ id, type, status }) =>
      !componentScriptIds.includes(id) &&
      type === "account-component" &&
      status === "compiled",
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the selected script when the component type changes.
  useEffect(() => {
    setScriptId("");
  }, [componentType]);
  const onClose = () => {
    setScriptId("");
    setComponentType("account-component");
    closeCreateComponentDialog();
  };
  return (
    <Dialog
      open={createComponentDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent data-modal="false" className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Create Component</DialogTitle>
          <DialogDescription>Create a new component.</DialogDescription>
        </DialogHeader>
        <form
          id="create-component-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setLoading(true);
            const component = newComponent({
              name: formData.get("name")?.toString() ?? "",
              type: componentType,
              scriptId,
            });
            setLoading(false);
            onClose();
            toast(`${component.name} has been created.`);
            navigate(`/components/${component.id}`);
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
                onValueChange={(type) =>
                  setComponentType(type as ComponentType)
                }
                value={componentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(componentTypes).map((type) => (
                    <SelectItem key={type} value={type}>
                      {componentTypes[type as ComponentType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="script">Script</Label>
              <Select
                items={shownScripts.map(({ id, name }) => ({
                  value: id,
                  label: name,
                }))}
                onValueChange={(value) => setScriptId(value ?? "")}
                value={scriptId || null}
              >
                <SelectTrigger
                  className="w-45"
                  disabled={shownScripts.length === 0}
                >
                  <SelectValue placeholder="Select script…" />
                </SelectTrigger>
                <SelectContent>
                  {shownScripts.map((script) => (
                    <SelectItem key={script.id} value={script.id}>
                      {script.name}
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
            form="create-component-form"
            type="submit"
            disabled={loading || !scriptId}
          >
            {loading && <Spinner />}
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateComponentDialog;
