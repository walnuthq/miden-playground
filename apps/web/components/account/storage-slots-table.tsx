import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@workspace/ui/components/table";
import { type StorageSlot, storageSlotTypes } from "@/lib/types/component";
import { formatValue } from "@/lib/utils";

const StorageSlotsTable = ({
  storage,
  storageSlots,
}: {
  storage: string[];
  storageSlots: StorageSlot[];
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {storageSlots.map(({ name, type }, index) => (
          <TableRow key={name}>
            <TableCell>{name}</TableCell>
            <TableCell>{storageSlotTypes[type]}</TableCell>
            <TableCell>{formatValue(storage[index] ?? "")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default StorageSlotsTable;
