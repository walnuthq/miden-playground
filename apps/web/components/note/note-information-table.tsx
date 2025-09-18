import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { type InputNote, noteStates } from "@/lib/types/note";
import AccountAddress from "@/components/lib/account-address";
import { CircleCheckBig } from "lucide-react";
import useScripts from "@/hooks/use-scripts";

const NoteInformationTable = ({ inputNote }: { inputNote: InputNote }) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ root }) => root === inputNote.scriptRoot);
  return (
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
          {script && (
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {script.id === "p2id" && "P2ID (Pay-to-ID) Verified Note"}
                  <CircleCheckBig
                    color="var(--color-green-500)"
                    className="size-4"
                  />
                </div>
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell>Storage mode</TableCell>
            <TableCell>
              <Badge
                variant={
                  inputNote.type === "public" ? "default" : "destructive"
                }
                className="capitalize"
              >
                {inputNote.type}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>State</TableCell>
            <TableCell>{noteStates[inputNote.state]}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>{inputNote.tag}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sender ID</TableCell>
            <TableCell>
              <AccountAddress id={inputNote.senderId} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default NoteInformationTable;
