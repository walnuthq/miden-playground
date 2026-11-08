import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import CopyButton from "@/components/lib/copy-button";
import type { ProcedureExport, Script } from "@/lib/types/script";
import {
  formatProcedureExportParamType,
  formatProcedureExportPath,
  formatProcedureExportResultType,
} from "@/lib/utils/script";

const procedureSignature = ({
  path,
  signature: { params, results },
}: ProcedureExport) => {
  let result = `fn ${formatProcedureExportPath(path)}(`;
  result += params
    .map((param) => formatProcedureExportParamType(param))
    .join(", ");
  result += ")";
  if (results.length > 0) {
    result += ` -> `;
    const resultTypes = results
      .map((result) => formatProcedureExportResultType(result))
      .join(", ");
    result += results.length === 1 ? resultTypes : `(${resultTypes})`;
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
                {/* api-compile's analysis (read-only-procedures.md): the
                    Playground runs these locally instead of submitting a
                    transaction. */}
                {procedureExport.readOnly && (
                  <Badge variant="outline">Read-only</Badge>
                )}
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
