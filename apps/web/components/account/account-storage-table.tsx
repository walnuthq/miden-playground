import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

const AccountStorageTable = ({ storage }: { storage: string[] }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Slot Index</TableHead>
          <TableHead>Item Slot Type</TableHead>
          <TableHead>Value / Commitment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {storage.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{index}</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>{item}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default AccountStorageTable;
