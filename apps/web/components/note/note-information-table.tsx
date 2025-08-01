import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { type InputNote } from "@/lib/types";
import AccountAddress from "@/components/lib/account-address";
import { CircleCheckBig } from "lucide-react";

const NoteInformationTable = ({ inputNote }: { inputNote: InputNote }) => (
  <div className="rounded-md border">
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>ID</TableCell>
          <TableCell>{inputNote.id}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Script Root</TableCell>
          <TableCell>{inputNote.scriptRoot}</TableCell>
        </TableRow>
        {/* <TableRow>
          <TableCell>Serial Number</TableCell>
          <TableCell>{noteSerialNumber(inputNote)}</TableCell>
        </TableRow> */}
        {inputNote.wellKnownNote && (
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <CircleCheckBig
                  color="var(--color-green-500)"
                  className="size-4"
                />
                {inputNote.wellKnownNote === "P2ID" &&
                  "P2ID (Pay-to-ID) Verified Note"}
              </div>
            </TableCell>
          </TableRow>
        )}
        <TableRow>
          <TableCell>Storage mode</TableCell>
          <TableCell>
            <Badge
              variant={inputNote.type === "Public" ? "default" : "destructive"}
            >
              {inputNote.type}
            </Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>State</TableCell>
          <TableCell>{inputNote.state}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Tag</TableCell>
          <TableCell>{inputNote.tag}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Sender ID</TableCell>
          <TableCell>
            <AccountAddress address={inputNote.senderAddress} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export default NoteInformationTable;
