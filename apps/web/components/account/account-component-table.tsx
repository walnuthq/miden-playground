import Link from "next/link";
import useScripts from "@/hooks/use-scripts";
import { type Account } from "@/lib/types/account";
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
}: {
  account: Account;
  component: Component;
}) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ id }) => id === component.scriptId);
  if (!script) {
    return null;
  }
  return (
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
};

export default AccountComponentTable;
