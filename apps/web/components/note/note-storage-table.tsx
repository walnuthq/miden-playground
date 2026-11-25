import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
        {storage.map((value, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- storage items are identified by their position.
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
