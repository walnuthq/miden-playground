import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@workspace/ui/components/table";

const NoteStorageTable = ({ storage }: { storage: string[] }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Index</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* TODO remove */}
        {storage.slice(0, 3).map((value, index) => (
          <TableRow key={index}>
            <TableCell>{index}</TableCell>
            <TableCell>{BigInt(value)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default NoteStorageTable;
