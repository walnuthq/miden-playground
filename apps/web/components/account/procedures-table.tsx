import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
} from "@workspace/ui/components/table";
import { type Account } from "@/lib/types/account";
import { type Script } from "@/lib/types/script";
import { type Component } from "@/lib/types/component";
import ProceduresTableRow from "@/components/account/procedures-table-row";

const ProceduresTable = ({
  account,
  script,
  component,
}: {
  account: Account;
  script: Script;
  component: Component;
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Name</TableHead>
          {component.type === "account" && <TableHead>Result</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {script.procedures.map((procedure) => (
          <ProceduresTableRow
            key={procedure.name}
            account={account}
            component={component}
            scriptId={script.id}
            procedure={procedure}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ProceduresTable;
