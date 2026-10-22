"use client";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@workspace/ui/components/field";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
import {
  type ScriptExample,
  type ScriptType,
  scriptExamples,
  scriptTypes,
} from "@/lib/types/script";
import { kebabCase } from "@/lib/utils";

const CreateScriptDialog = () => {
  const router = useRouter();
  const { createScriptDialogOpen, closeCreateScriptDialog, newScript } =
    useScripts();
  const [loading, setLoading] = useState(false);
  const [scriptType, setScriptType] = useState<ScriptType>("account-component");
  const [scriptExample, setScriptExample] = useState<ScriptExample | "none">(
    "none",
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the selected example when the script type changes.
  useEffect(() => {
    setScriptExample("none");
  }, [scriptType]);
  const onClose = () => {
    setScriptType("account-component");
    setScriptExample("none");
    closeCreateScriptDialog();
  };
  return (
    <Dialog
      open={createScriptDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent data-modal="false" className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Create Script</DialogTitle>
          <DialogDescription>Create a new script.</DialogDescription>
        </DialogHeader>
        <form
          id="create-script-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setLoading(true);
            const { script, error } = await newScript({
              name: kebabCase(formData.get("name")?.toString() ?? ""),
              type: scriptType,
              example: scriptExample,
            });
            setLoading(false);
            if (script) {
              toast(`${script.name} has been created.`);
              router.push(`/scripts/${script.id}`);
              onClose();
            } else {
              toast.error("Failed to create script.", { description: error });
            }
          }}
        >
          <FieldSet>
            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field className="grid col-span-2">
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  pattern="[a-zA-Z][a-zA-Z0-9_\-]{0,63}"
                />
                <FieldDescription>
                  Package name, 2 characters minimum.
                </FieldDescription>
              </Field>
              <Field className="grid gap-3">
                <Label htmlFor="type">Type</Label>
                <Select
                  items={scriptTypes}
                  onValueChange={(type) => setScriptType(type as ScriptType)}
                  value={scriptType}
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(scriptTypes)
                      .filter(
                        (type) =>
                          ![
                            "kernel",
                            "library",
                            "authentication-component",
                          ].includes(type),
                      )
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {scriptTypes[type as ScriptType]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="grid gap-3">
                <Label htmlFor="example">Example</Label>
                <Select
                  items={{
                    none: "None",
                    ...Object.fromEntries(
                      Object.entries(scriptExamples).map(([id, { name }]) => [
                        id,
                        name,
                      ]),
                    ),
                  }}
                  onValueChange={(value) =>
                    setScriptExample(value as ScriptExample)
                  }
                  value={scriptExample}
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select example" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="none" value="none">
                      None
                    </SelectItem>
                    {Object.keys(scriptExamples)
                      .map((id) => ({
                        id,
                        ...scriptExamples[id as ScriptExample],
                      }))
                      .filter(({ type }) => type === scriptType)
                      .map(({ id, name }) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button form="create-script-form" type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScriptDialog;
