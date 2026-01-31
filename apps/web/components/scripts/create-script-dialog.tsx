"use client";
import { kebabCase } from "lodash";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import useScripts from "@/hooks/use-scripts";
import {
  type ScriptType,
  scriptTypes,
  type ScriptExample,
  scriptExamples,
} from "@/lib/types/script";

const CreateScriptDialog = () => {
  const router = useRouter();
  const { createScriptDialogOpen, closeCreateScriptDialog, newScript } =
    useScripts();
  const [loading, setLoading] = useState(false);
  const [scriptType, setScriptType] = useState<ScriptType>("account");
  const [scriptExample, setScriptExample] = useState<ScriptExample | "none">(
    // "counter-contract"
    "none",
  );
  useEffect(() => {
    // if (scriptType === "account") {
    //   setScriptExample("counter-contract");
    // } else if (scriptType === "note") {
    //   setScriptExample("p2id-note");
    // }
    setScriptExample("none");
  }, [scriptType]);
  const onClose = () => {
    setScriptType("account");
    // setScriptExample("counter-contract");
    setScriptExample("none");
    closeCreateScriptDialog();
  };
  return (
    <Dialog
      open={createScriptDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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
            const script = await newScript({
              name: kebabCase(formData.get("name")?.toString() ?? ""),
              type: scriptType,
              example: scriptExample,
            });
            setLoading(false);
            onClose();
            toast(`${script.name} has been created.`);
            router.push(`/scripts/${script.id}`);
          }}
        >
          <FieldSet>
            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field className="grid col-span-2">
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="name" required minLength={2} />
                <FieldDescription>
                  Package name, 2 characters minimum.
                </FieldDescription>
              </Field>
              <Field className="grid gap-3">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(type) => setScriptType(type as ScriptType)}
                  value={scriptType}
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(scriptTypes)
                      .filter((type) => type !== "library")
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
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
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
