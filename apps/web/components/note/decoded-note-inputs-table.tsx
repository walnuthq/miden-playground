import { type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";

const DecodedNoteInputsTable = ({
  inputs,
}: {
  inputs: { key: string; value: ReactNode }[];
}) => (
  <div className="rounded-md border">
    <Table>
      <TableBody>
        {inputs.map(({ key, value }) => (
          <TableRow key={key}>
            <TableCell>{key}</TableCell>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default DecodedNoteInputsTable;
