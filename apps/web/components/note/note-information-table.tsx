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
import { type InputNote } from "@/lib/types";
import useGlobalContext from "@/components/global-context/hook";
import AccountAddress from "@/components/lib/account-address";
import { CircleCheckBig } from "lucide-react";

const NoteInformationTable = ({
  inputNote: { id, inputNote },
}: {
  inputNote: InputNote;
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
            <TableCell>{id}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Script Root</TableCell>
            <TableCell>{noteScriptRoot(inputNote)}</TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell>Serial Number</TableCell>
            <TableCell>{noteSerialNumber(inputNote)}</TableCell>
          </TableRow> */}
          {wellKnownNote && (
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CircleCheckBig
                    color="var(--color-green-500)"
                    className="size-4"
                  />
                  {wellKnownNote === "P2ID" && "P2ID (Pay-to-ID) Verified Note"}
                </div>
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell>Storage mode</TableCell>
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
