"use client";
import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { RotateCw, Trash } from "lucide-react";
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
import useComponents from "@/hooks/use-components";
import {
  type StorageSlotType,
  storageSlotTypes,
  stringToKeyValues,
  keyValuesToString,
} from "@/lib/types/component";
import { sleep } from "@/lib/utils";

const StorageSlotInput = ({
  storageSlotValue,
  setStorageSlotValue,
}: {
  storageSlotValue: string;
  setStorageSlotValue: Dispatch<SetStateAction<string>>;
}) => (
  <div className="grid gap-3 col-span-2">
    <Label htmlFor="value">Default Value</Label>
    <Input
      id="value"
      name="value"
      type="number"
      min="0"
      value={storageSlotValue}
      onChange={(event) => setStorageSlotValue(event.target.value)}
      required
    />
  </div>
);

const StorageMapInput = ({
  storageSlotValue,
  setStorageSlotValue,
}: {
  storageSlotValue: string;
  setStorageSlotValue: Dispatch<SetStateAction<string>>;
}) => {
  const keyValues = stringToKeyValues(storageSlotValue);
  return (
    <div className="grid gap-3 col-span-2">
      <Label htmlFor="value">Default Values</Label>
      {keyValues.map((keyValue, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            id={`key-${index}`}
            name={`key-${index}`}
            placeholder="Key"
            type="number"
            min="0"
            value={keyValue.key}
            onChange={(event) =>
              setStorageSlotValue(
                keyValuesToString([
                  ...keyValues.slice(0, index),
                  { ...keyValue, key: event.target.value },
                  ...keyValues.slice(index + 1),
                ])
              )
            }
            required
          />
          <Input
            id={`value-${index}`}
            name={`value-${index}`}
            placeholder="Value"
            type="number"
            min="0"
            value={keyValue.value}
            onChange={(event) =>
              setStorageSlotValue(
                keyValuesToString([
                  ...keyValues.slice(0, index),
                  { ...keyValue, value: event.target.value },
                  ...keyValues.slice(index + 1),
                ])
              )
            }
            required
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="size-8"
            onClick={() =>
              setStorageSlotValue(
                keyValuesToString([
                  ...keyValues.slice(0, index),
                  ...keyValues.slice(index + 1),
                ])
              )
            }
          >
            <Trash />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          setStorageSlotValue(
            keyValuesToString([...keyValues, { key: "", value: "" }])
          )
        }
      >
        Add key-value pair
      </Button>
    </div>
  );
};

const UpsertStorageSlotDialog = ({
  componentId,
  storageSlotIndex,
}: {
  componentId: string;
  storageSlotIndex: number;
}) => {
  const {
    components,
    upsertStorageSlotDialogOpen,
    closeUpsertStorageSlotDialog,
    updateComponent,
  } = useComponents();
  const component = components.find(({ id }) => id === componentId);
  const storageSlot = component?.storageSlots.find(
    (_, index) => index === storageSlotIndex
  );
  const [loading, setLoading] = useState(false);
  const [storageSlotType, setStorageSlotType] = useState<StorageSlotType>(
    storageSlot?.type ?? "value"
  );
  const [storageSlotValue, setStorageSlotValue] = useState(
    storageSlot?.value ?? ""
  );
  const onClose = () => {
    setStorageSlotType("value");
    setStorageSlotValue("");
    closeUpsertStorageSlotDialog();
  };
  useEffect(() => {
    setStorageSlotType(storageSlot?.type ?? "value");
    setStorageSlotValue(storageSlot?.value ?? "");
  }, [storageSlot?.type, storageSlot?.value]);
  return (
    <Dialog
      open={upsertStorageSlotDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-[640px] z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {storageSlot ? "Edit" : "Create"} Storage Slot
          </DialogTitle>
          <DialogDescription>
            {storageSlot ? "Edit an existing" : "Create a new"} storage slot.
          </DialogDescription>
        </DialogHeader>
        <form
          id="upsert-storage-slot-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!component) {
              return;
            }
            const formData = new FormData(event.currentTarget);
            const upsertedStorageSlot = {
              name: formData.get("name")?.toString() ?? "",
              type: storageSlotType,
              value: storageSlotValue,
            };
            setLoading(true);
            await sleep(400);
            updateComponent({
              ...component,
              storageSlots: storageSlot
                ? [
                    ...component.storageSlots.slice(0, storageSlotIndex),
                    upsertedStorageSlot,
                    ...component.storageSlots.slice(storageSlotIndex + 1),
                  ]
                : [...component.storageSlots, upsertedStorageSlot],
            });
            setLoading(false);
            onClose();
            toast(`${component.name} has been updated.`);
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={storageSlot?.name}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="type">Type</Label>
              <Select
                onValueChange={(type) =>
                  setStorageSlotType(type as StorageSlotType)
                }
                value={storageSlotType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(storageSlotTypes).map((type) => (
                    <SelectItem key={type} value={type}>
                      {storageSlotTypes[type as StorageSlotType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {storageSlotType === "value" ? (
              <StorageSlotInput
                storageSlotValue={storageSlotValue}
                setStorageSlotValue={setStorageSlotValue}
              />
            ) : (
              <StorageMapInput
                storageSlotValue={storageSlotValue}
                setStorageSlotValue={setStorageSlotValue}
              />
            )}
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="upsert-storage-slot-form"
            type="submit"
            disabled={loading}
          >
            {loading && <RotateCw className="animate-spin" />}
            {storageSlot
              ? loading
                ? "Editing…"
                : "Edit"
              : loading
                ? "Creating…"
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertStorageSlotDialog;
