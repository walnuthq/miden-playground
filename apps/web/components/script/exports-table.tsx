import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import CopyButton from "@/components/lib/copy-button";
import { type Script, type ProcedureExport } from "@/lib/types/script";
import { formatProcedureExportPath } from "@/lib/utils";

const procedureSignature = ({
  path,
  signature: { params, results },
}: ProcedureExport) => {
  let result = `fn ${formatProcedureExportPath(path).replaceAll("-", "_")}(`;
  result += params.map((param) => param).join(", ");
  result += ")";
  if (results.length > 0) {
    result += ` -> `;
    if (results.length === 1) {
      result += "Felt";
    } else if (results.length === 4) {
      result += "Word";
    }
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
        {script.procedureExports.map((procedureExport) => (
          <TableRow key={procedureExport.digest}>
            <TableCell>
              <div className="flex items-center gap-2">
                {formatProcedureExportPath(procedureExport.path)}
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
