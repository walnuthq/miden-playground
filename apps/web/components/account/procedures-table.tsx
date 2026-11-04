import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import ProceduresTableRow, {
  canInvokeProcedure,
} from "@/components/account/procedures-table-row";
import type { Account } from "@/lib/types/account";
import type { Component } from "@/lib/types/component";
import type { Script } from "@/lib/types/script";

const ProceduresTable = ({
  account,
  script,
  component,
}: {
  account: Account;
  script: Script;
  component: Component;
}) => {
  const showResultColumn = script.procedureExports.some((procedureExport) =>
    canInvokeProcedure({ account, component, procedureExport }),
  );
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-45">Name</TableHead>
            {showResultColumn && <TableHead>Result</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {script.procedureExports.map((procedureExport) => (
            <ProceduresTableRow
              key={procedureExport.path}
              account={account}
              component={component}
              script={script}
              procedureExport={procedureExport}
              showResultColumn={showResultColumn}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProceduresTable;
