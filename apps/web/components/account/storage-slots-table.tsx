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
import { stringToFeltArray } from "@/lib/utils";
import { type StorageItem, getItem } from "@/lib/types/account";
import { uniqBy } from "lodash";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { bigintToWord } from "@/lib/web-client";

const StorageSlotValueTooltip = ({ value }: { value: string }) => {
  const [, , , dec] = stringToFeltArray(value);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" className="-ml-4">
          {dec}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Hex: {value}</p>
        <p>Dec: {dec}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const StorageSlotMapTable = ({
  storageItem,
  value,
}: {
  storageItem: StorageItem;
  value: string;
}) => {
  const { midenSdk } = useMidenSdk();
  const keyValuePairs = value.split(",");
  const keyValues = keyValuePairs.map((pair) => {
    const [key = "", value = ""] = pair.split(":");
    return {
      key: bigintToWord({ value: BigInt(key), midenSdk }).toHex(),
      value: bigintToWord({ value: BigInt(value), midenSdk }).toHex(),
    };
  });
  const entries = uniqBy([...storageItem.mapEntries, ...keyValues], "key");
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
        {storageSlots.map(({ name, type, value }, index) => (
          <TableRow key={name}>
            <TableCell>{name}</TableCell>
            <TableCell>{storageSlotTypes[type]}</TableCell>
            <TableCell>
              {type === "value" && (
                <StorageSlotValueTooltip value={getItem(storage, index)} />
              )}
              {type === "map" && storage[index] && (
                <StorageSlotMapTable
                  storageItem={storage[index]}
                  value={value}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default StorageSlotsTable;
