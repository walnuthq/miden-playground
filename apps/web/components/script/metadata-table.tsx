import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { type Script, scriptTypes } from "@/lib/types/script";

const MetadataTable = ({ script }: { script: Script }) => (
  <div className="rounded-md border">
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>{script.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>{scriptTypes[script.type]}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Digest</TableCell>
          <TableCell>{script.digest}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Created at</TableCell>
          <TableCell>{new Date(script.createdAt).toLocaleString()}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Updated at</TableCell>
          <TableCell>{new Date(script.updatedAt).toLocaleString()}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export default MetadataTable;
