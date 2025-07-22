import {
  noteScriptRoot,
  noteWellKnownNote,
  // noteSerialNumber,
  noteType,
  noteState,
  noteTag,
  noteSenderAddress,
} from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { type InputNoteRecord } from "@workspace/mock-web-client";
import useGlobalContext from "@/components/global-context/hook";
import AccountAddress from "@/components/lib/account-address";

const NoteInformationTable = ({
  inputNote,
}: {
  inputNote: InputNoteRecord;
}) => {
  const { networkId } = useGlobalContext();
  const wellKnownNote = noteWellKnownNote(inputNote);
  const type = noteType(inputNote);
  return (
    <div className="rounded-md border">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>{inputNote.id().toString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Script Root</TableCell>
            <TableCell>
              {noteScriptRoot(inputNote)}
              {wellKnownNote ? ` (${wellKnownNote})` : ""}
            </TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell>Serial Number</TableCell>
            <TableCell>{noteSerialNumber(inputNote)}</TableCell>
          </TableRow> */}
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>
              <Badge variant={type === "Public" ? "default" : "destructive"}>
                {type}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>State</TableCell>
            <TableCell>{noteState(inputNote)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>{noteTag(inputNote)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sender ID</TableCell>
            <TableCell>
              <AccountAddress
                address={noteSenderAddress(inputNote, networkId)}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default NoteInformationTable;
