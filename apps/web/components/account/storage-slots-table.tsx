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
  const feltArray = stringToFeltArray(value);
  const [first = 0n] = feltArray.filter((felt) => felt !== 0n);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">{first}</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Hex: {value}</p>
        <p>Dec: [{feltArray.join(", ")}]</p>
      </TooltipContent>
    </Tooltip>
  );
};

const StorageSlotMapTable = ({
  storageItem,
  defaultValue,
}: {
  storageItem: StorageItem;
  defaultValue: string;
}) => {
  const { midenSdk } = useMidenSdk();
  const keyValuePairs = defaultValue === "" ? [] : defaultValue.split(",");
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
        {storageSlots.map((storageSlot) => {
          const storageItem = storage.find(
            ({ name }) => name === storageSlot.name,
          );
          return (
            <TableRow key={storageSlot.name}>
              <TableCell>{storageSlot.name}</TableCell>
              <TableCell>{storageSlotTypes[storageSlot.type]}</TableCell>
              <TableCell>
                {storageSlot.type === "value" && storageItem && (
                  <StorageSlotValueTooltip value={getItem(storageItem)} />
                )}
                {storageSlot.type === "map" && storageItem && (
                  <StorageSlotMapTable
                    storageItem={storageItem}
                    defaultValue={storageSlot.value}
                  />
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
