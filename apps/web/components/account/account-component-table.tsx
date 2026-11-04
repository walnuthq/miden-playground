import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import type { ReactNode } from "react";
import { Link } from "react-router";
import ProceduresTable from "@/components/account/procedures-table";
import StorageSlotsTable from "@/components/account/storage-slots-table";
import type { Account } from "@/lib/types/account";
import type { Component } from "@/lib/types/component";
import type { Script } from "@/lib/types/script";

// A row holding a nested table. On a phone the label goes above the table
// rather than beside it, which leaves the nested table the whole width. Its
// cell's `max-w-0` keeps the nested table from widening this one: the nested
// table scrolls horizontally inside its own container instead, so its last
// column (the procedures' Invoke buttons) isn't pushed off-screen.
const NestedTableRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  const isMobile = useIsMobile();
  return isMobile ? (
    <>
      <TableRow className="border-b-0 hover:bg-transparent">
        <TableCell colSpan={2} className="pb-0">
          {label}
        </TableCell>
      </TableRow>
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={2} className="max-w-0">
          {children}
        </TableCell>
      </TableRow>
    </>
  ) : (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell className="w-full max-w-0">{children}</TableCell>
    </TableRow>
  );
};

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
          <TableCell>Name</TableCell>
          <TableCell>{component.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Script</TableCell>
          <TableCell>
            <Link
              className="text-primary font-medium underline underline-offset-4"
              to={`/scripts/${component.scriptId}`}
            >
              {script.name}
            </Link>
          </TableCell>
        </TableRow>
        {component.storageSlots.length > 0 && (
          <NestedTableRow label="Storage Slots">
            <StorageSlotsTable
              storage={account.storage}
              storageSlots={component.storageSlots}
            />
          </NestedTableRow>
        )}
        {script.procedureExports.length > 0 && (
          <NestedTableRow label="Procedures">
            <ProceduresTable
              account={account}
              script={script}
              component={component}
            />
          </NestedTableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

export default AccountComponentTable;
