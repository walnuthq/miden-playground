import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { type Component, storageSlotTypes } from "@/lib/types/component";
import useComponents from "@/hooks/use-components";

const StorageSlotActionsCell = ({
  component,
  storageSlotName,
}: {
  component: Component;
  storageSlotName: string;
}) => {
  const { openUpsertStorageSlotDialog, updateComponent } = useComponents();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            openUpsertStorageSlotDialog({
              componentId: component.id,
              storageSlotName,
            })
          }
        >
          Edit storage slot
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const storageSlotIndex = component.storageSlots.findIndex(
              ({ name }) => name === storageSlotName,
            );
            updateComponent({
              ...component,
              storageSlots: [
                ...component.storageSlots.slice(0, storageSlotIndex),
                ...component.storageSlots.slice(storageSlotIndex + 1),
              ],
            });
          }}
        >
          Delete storage slot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ComponentStorageSlotsTable = ({
  component,
}: {
  component: Component;
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Default Value</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {component.storageSlots.map((storageSlot) => (
          <TableRow key={storageSlot.name}>
            <TableCell>{storageSlot.name}</TableCell>
            <TableCell>{storageSlotTypes[storageSlot.type]}</TableCell>
            <TableCell>{storageSlot.value}</TableCell>
            <TableCell>
              <StorageSlotActionsCell
                component={component}
                storageSlotName={storageSlot.name}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ComponentStorageSlotsTable;
