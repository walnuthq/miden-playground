import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import CopyButton from "@/components/lib/copy-button";
import { type Script, type Export } from "@/lib/types/script";

const procedureSignature = (procedureExport: Export) => {
  let result = `fn ${procedureExport.name.replaceAll("-", "_")}(`;
  result += procedureExport.signature.params.map((param) => param).join(", ");
  result += ")";
  if (procedureExport.signature.results.length > 0) {
    result += ` -> ${procedureExport.signature.results[0]}`;
  }
  return result;
};

const ExportsTable = ({ script }: { script: Script }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Signature</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {script.exports.map((procedureExport) => (
          <TableRow key={procedureExport.digest}>
            <TableCell>
              <div className="flex items-center gap-2">
                {procedureExport.name}
                <CopyButton
                  content="Copy Procedure Digest"
                  copy={procedureExport.digest}
                />
              </div>
            </TableCell>
            <TableCell>
              <pre>{procedureSignature(procedureExport)}</pre>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ExportsTable;
