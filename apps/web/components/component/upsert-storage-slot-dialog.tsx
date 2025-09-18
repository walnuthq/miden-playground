"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
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
import { type StorageSlotType, storageSlotTypes } from "@/lib/types/component";
import { sleep } from "@/lib/utils";

const UpsertStorageSlotDialog = () => {
  const {
    components,
    upsertStorageSlotDialogOpen,
    upsertStorageSlotDialogComponentId: componentId,
    upsertStorageSlotDialogStorageSlotIndex: storageSlotIndex,
    closeUpsertStorageSlotDialog,
    updateComponent,
  } = useComponents();
  const component = components.find(({ id }) => id === componentId);
  const storageSlot = component?.storageSlots.find(
    (_, index) => index === storageSlotIndex
  );
  const [loading, setLoading] = useState(false);
  const [storageSlotType, setStorageSlotType] =
    useState<StorageSlotType>("value");
  const onClose = () => {
    setStorageSlotType("value");
    closeUpsertStorageSlotDialog();
  };
  useEffect(() => {
    setStorageSlotType(storageSlot?.type ?? "value");
  }, [componentId, storageSlotIndex, storageSlot?.type]);
  return (
    <Dialog
      open={upsertStorageSlotDialogOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[640px] z-100">
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
              value: formData.get("value")?.toString() ?? "",
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
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="value">Default Value</Label>
              <Input
                id="value"
                name="value"
                defaultValue={storageSlot?.value}
                required
              />
            </div>
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
