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
import { Button } from "@workspace/ui/components/button";
import { formatValue } from "@/lib/utils";
import type { StorageItem } from "@/lib/types/account";

const ValueTooltip = ({ value }: { value: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="ghost">
        {formatValue(value)}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{value}</p>
    </TooltipContent>
  </Tooltip>
);

const AccountStorageDeltaTable = ({
  storageDelta,
}: {
  storageDelta: { index: number; before: StorageItem; after: string }[];
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Storage Slot</TableHead>
          <TableHead>Storage Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {storageDelta.map(({ index, before, after }) => (
          <TableRow key={index}>
            <TableCell>{index}</TableCell>
            <TableCell className="space-y-2.5">
              <p>
                Before:
                <ValueTooltip value={before.item} />
              </p>
              <p>
                After:
                <ValueTooltip value={after} />
              </p>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default AccountStorageDeltaTable;
