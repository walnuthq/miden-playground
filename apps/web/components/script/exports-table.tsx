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
import type { Script } from "@/lib/types/script";
import {
  formatProcedureExportPath,
  procedureSignature,
} from "@/lib/utils/script";

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
