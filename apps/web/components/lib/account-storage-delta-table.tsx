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
import { formatStorageSlotName } from "@/lib/utils/account";

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
  storageDelta: { name: string; key?: string; before: string; after: string }[];
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
        {storageDelta.map(({ name, key, before, after }) => (
          <TableRow key={`${name}:${key ?? ""}`}>
            <TableCell>{formatStorageSlotName(name)}</TableCell>
            <TableCell className="space-y-2.5">
              {key !== undefined && (
                <p>
                  Key:
                  <ValueTooltip value={key} />
                </p>
              )}
              <p>
                Before:
                <ValueTooltip value={before} />
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
