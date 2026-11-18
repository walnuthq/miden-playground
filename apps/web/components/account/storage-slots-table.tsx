import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import StorageSlotName from "@/components/lib/storage-slot-name";
import type { StorageItem } from "@/lib/types/account";
import {
  type StorageSlotType,
  storageSlotTypes,
} from "@/lib/types/storage-slot";
import { getItem } from "@/lib/utils/account";
import { wasmWordFromHex } from "@/lib/web-client";

const StorageSlotValueTooltip = ({ value }: { value: string }) => {
  const feltArray = wasmWordFromHex(value);
  const [first = 0n] = feltArray.filter((felt) => felt !== 0n);
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>
        {first}
      </TooltipTrigger>
      <TooltipContent>
        <p>Hex: {value}</p>
        <p>Dec: [{feltArray.join(", ")}]</p>
      </TooltipContent>
    </Tooltip>
  );
};

// A map slot's entries: those the account holds, none until set.
const StorageSlotMapTable = ({ storageItem }: { storageItem: StorageItem }) => {
  const entries = storageItem.mapEntries;
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(({ key, value }) => (
            <TableRow key={key}>
              <TableCell>
                <StorageSlotValueTooltip value={key} />
              </TableCell>
              <TableCell>
                <StorageSlotValueTooltip value={value} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const StorageSlotsTable = ({
  storage,
  storageSlots,
}: {
  storage: StorageItem[];
  storageSlots: { name: string; type: StorageSlotType }[];
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
        {storageSlots.map((storageSlot) => {
          const storageItem = storage.find(
            ({ name }) => name === storageSlot.name,
          );
          return (
            <TableRow key={storageSlot.name}>
              {/* Wraps: the full name is wider than a phone. */}
              <TableCell className="min-w-40 whitespace-normal">
                <StorageSlotName name={storageSlot.name} />
              </TableCell>
              <TableCell>{storageSlotTypes[storageSlot.type]}</TableCell>
              <TableCell>
                {storageSlot.type === "value" && storageItem && (
                  <StorageSlotValueTooltip value={getItem(storageItem)} />
                )}
                {storageSlot.type === "map" && storageItem && (
                  <StorageSlotMapTable storageItem={storageItem} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default StorageSlotsTable;
