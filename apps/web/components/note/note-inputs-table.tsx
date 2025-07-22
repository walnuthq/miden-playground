import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@workspace/ui/components/table";
import { type NoteInputs } from "@workspace/mock-web-client";

const NoteInputsTable = ({ inputs }: { inputs: NoteInputs }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Index</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inputs.values().map((value, index) => (
          <TableRow key={index}>
            <TableCell>{index}</TableCell>
            <TableCell>{value.asInt()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default NoteInputsTable;
