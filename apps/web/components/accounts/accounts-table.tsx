"use client";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type RowData,
  flexRender,
  useTable,
} from "@tanstack/react-table";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import CreateAccountDropdownMenu from "@/components/accounts/create-account-dropdown-menu";
import { getIdentifierPart } from "@/lib/utils/account";
import { type DataTableFeatures, dataTableFeatures } from "@/lib/table";

const AccountsTable = <TData extends RowData>({
  columns,
  data,
}: {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
}) => {
  const router = useRouter();
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter by account ID…"
          value={(table.getColumn("address")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("address")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <CreateAccountDropdownMenu />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn({
                        "cursor-pointer": !["address", "actions"].includes(
                          cell.column.id,
                        ),
                      })}
                      onClick={() =>
                        !["address", "actions"].includes(cell.column.id) &&
                        router.push(
                          `/accounts/${getIdentifierPart(cell.row.getValue("address"))}`,
                        )
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AccountsTable;
