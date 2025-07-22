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

const ValueTooltip = ({ value }: { value: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" className="-ml-4">
        Updated ({formatValue(value)})
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Updated ({value})</p>
    </TooltipContent>
  </Tooltip>
);

const AccountStorageDeltaTable = ({ values }: { values: string[] }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Storage Slot</TableHead>
          <TableHead>Effect</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {values.map((value, index) => (
          <TableRow key={index}>
            <TableCell>{index}</TableCell>
            <TableCell>
              <ValueTooltip value={value} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default AccountStorageDeltaTable;
