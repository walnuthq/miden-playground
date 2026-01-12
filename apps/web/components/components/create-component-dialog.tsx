"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import useScripts from "@/hooks/use-scripts";
import useComponents from "@/hooks/use-components";
import { type ComponentType, componentTypes } from "@/lib/types/component";

const CreateComponentDialog = () => {
  const router = useRouter();
  const {
    components,
    createComponentDialogOpen,
    closeCreateComponentDialog,
    newComponent,
  } = useComponents();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  const [scriptId, setScriptId] = useState("");
  const [componentType, setComponentType] = useState<ComponentType>("account");
  const componentScriptIds = components.map(({ scriptId }) => scriptId);
  const shownScripts = scripts.filter(
    ({ id, type, status }) =>
      !componentScriptIds.includes(id) &&
      type === componentType &&
      status === "compiled"
  );
  useEffect(() => {
    setScriptId("");
  }, [componentType]);
  const onClose = () => {
    setScriptId("");
    setComponentType("account");
    closeCreateComponentDialog();
  };
  return (
    <Dialog
      open={createComponentDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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
            router.push(`/components/${component.id}`);
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
              <Select onValueChange={setScriptId} value={scriptId}>
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
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
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
