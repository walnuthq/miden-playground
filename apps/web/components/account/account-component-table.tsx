import Link from "next/link";
import { type Account } from "@/lib/types/account";
import { type Script } from "@/lib/types/script";
import { type Component, componentTypes } from "@/lib/types/component";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import StorageSlotsTable from "@/components/account/storage-slots-table";
import ProceduresTable from "@/components/account/procedures-table";

const AccountComponentTable = ({
  account,
  component,
  script,
}: {
  account: Account;
  component: Component;
  script: Script;
}) => (
  <div className="rounded-md border">
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>{componentTypes[component.type]}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Script</TableCell>
          <TableCell>
            <Link
              className="text-primary font-medium underline underline-offset-4"
              href={`/scripts/${component.scriptId}`}
            >
              {script.name}
            </Link>
          </TableCell>
        </TableRow>
        {component.storageSlots.length > 0 && (
          <TableRow>
            <TableCell>Storage Slots</TableCell>
            <TableCell>
              <StorageSlotsTable
                storage={account.storage}
                storageSlots={component.storageSlots}
              />
            </TableCell>
          </TableRow>
        )}
        {script.exports.length > 0 && (
          <TableRow>
            <TableCell>Procedures</TableCell>
            <TableCell>
              <ProceduresTable
                account={account}
                script={script}
                component={component}
              />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

export default AccountComponentTable;
