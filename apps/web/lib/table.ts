import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  filterFn_includesString,
  rowSelectionFeature,
  tableFeatures,
} from "@tanstack/react-table";

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

export type DataTableFeatures = typeof dataTableFeatures;

// Below `md`, a table shows only the columns a phone can fit, and its row
// actions. Hidden with CSS, not column visibility: the table still reads the
// hidden columns' values (filters, row links).
export const mobileColumnClassName = (
  columnId: string,
  hiddenOnMobile: readonly string[],
) => (hiddenOnMobile.includes(columnId) ? "hidden md:table-cell" : undefined);
