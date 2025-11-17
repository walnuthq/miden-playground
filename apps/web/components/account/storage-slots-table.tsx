import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Button } from "@workspace/ui/components/button";
import { type StorageSlot, storageSlotTypes } from "@/lib/types/component";
import { formatValue, stringToFeltArray } from "@/lib/utils";

const StorageSlotValueTooltip = ({ value }: { value: string }) => {
  const [, , , dec] = stringToFeltArray(value);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" className="-ml-4">
          {formatValue(value)}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Hex: {value}</p>
        <p>Dec: {dec}</p>
      </TooltipContent>
    </Tooltip>
  );
};

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
            <TableCell>
              <StorageSlotValueTooltip value={storage[index] ?? ""} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default StorageSlotsTable;
