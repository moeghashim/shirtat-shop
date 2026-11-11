import type { ReactNode } from "react";

import type { ReactTable, RowData } from "@tanstack/react-table";

import { cn } from "cn";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DataTableFeatures } from "@/lib/data-table-features";

/** Presentation contract for a caller-owned TanStack Table v9 instance. */
export interface DataTableProps<T extends RowData> {
  /** Create with dataTableFeatures. The caller owns data, columns, sorting and pagination state. */
  table: ReactTable<DataTableFeatures, T>;
  /** Accessible table name and pagination landmark prefix. */
  label: string;
  /** Empty content, including any route-owned recovery action. Defaults to “No results.” */
  empty?: ReactNode;
  /** Show Previous/Next controls and row counts. Disable for caller-owned pagination. Defaults to true. */
  pagination?: boolean;
  /** Reflow into labelled fields below md, or retain a locally scrolling table. Defaults to reflow. */
  mobile?: "reflow" | "scroll";
  /** Plain labels keyed by column ID for mobile fields and sorting. Falls back to string header, then ID. */
  columnLabels?: Record<string, string>;
  /** Additional layout classes on the outer container. */
  className?: string;
}

/**
 * Shared sortable table with pagination, an empty state and labelled mobile fields.
 * Derived from the existing TaskRows renderer, Products pagination and Infrastructure reflow.
 * Use non-interactive column headers: this block supplies sort buttons for sortable leaf columns.
 * Configure server sorting/pagination on the supplied instance; no fetching or route behavior lives here.
 */
export function DataTable<T extends RowData>({
  table,
  label,
  empty = "No results.",
  pagination = true,
  mobile = "reflow",
  columnLabels,
  className,
}: DataTableProps<T>) {
  const reflow = mobile === "reflow";
  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = table.state.pagination;
  const total = table.getRowCount();
  const columnLabel = (id: string) => {
    const header = table.getColumn(id)?.columnDef.header;
    return columnLabels?.[id] ?? (typeof header === "string" ? header : id);
  };

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      <div className="bg-card overflow-hidden rounded-xl border">
        <Table aria-label={label} role="table" className={cn(reflow && "block md:table")}>
          <TableHeader role="rowgroup" className={cn(reflow && "block md:table-header-group")}>
            {table.getHeaderGroups().map((group) => (
              <TableRow
                key={group.id}
                role="row"
                className={cn("hover:bg-transparent", reflow && "flex flex-wrap md:table-row")}
              >
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const sortable = !header.isPlaceholder && !header.subHeaders.length && header.column.getCanSort();
                  const sortPresentation = {
                    asc: { Icon: ArrowUp, ariaSort: "ascending" as const },
                    desc: { Icon: ArrowDown, ariaSort: "descending" as const },
                    none: { Icon: ArrowUpDown, ariaSort: "none" as const },
                  }[sorted || "none"];
                  const { Icon } = sortPresentation;
                  return (
                    <TableHead
                      key={header.id}
                      role="columnheader"
                      scope={header.colSpan > 1 ? "colgroup" : "col"}
                      colSpan={header.colSpan}
                      aria-sort={sortable ? sortPresentation.ariaSort : undefined}
                      className={cn(
                        "text-muted-foreground px-4 font-medium",
                        reflow && "flex items-center md:table-cell",
                      )}
                    >
                      {!header.isPlaceholder &&
                        (sortable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-mx-2"
                            aria-label={`Sort by ${columnLabel(header.column.id)}`}
                            onClick={() => header.column.toggleSorting()}
                          >
                            <table.FlexRender header={header} />
                            <Icon className="size-3.5" aria-hidden="true" />
                          </Button>
                        ) : (
                          <table.FlexRender header={header} />
                        ))}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody role="rowgroup" className={cn(reflow && "block md:table-row-group")}>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  role="row"
                  data-state={table.state.rowSelection[row.id] ? "selected" : undefined}
                  className={cn("border-border", reflow && "grid grid-cols-2 gap-y-1 py-3 md:table-row md:py-0")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      role="cell"
                      className={cn(
                        "px-4 py-2 align-middle",
                        reflow && "block min-w-0 wrap-anywhere whitespace-normal md:table-cell",
                      )}
                    >
                      {reflow && (
                        <span aria-hidden="true" className="text-muted-foreground mb-1 block text-xs md:hidden">
                          {columnLabel(cell.column.id)}
                        </span>
                      )}
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow role="row" className={cn(reflow && "block md:table-row")}>
                <TableCell
                  role="cell"
                  colSpan={Math.max(1, table.getVisibleLeafColumns().length)}
                  className={cn(
                    "text-muted-foreground h-24 p-4 text-center whitespace-normal",
                    reflow && "block content-center md:table-cell",
                  )}
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm tabular-nums" role="status">
            {rows.length ? pageIndex * pageSize + 1 : 0}–{rows.length ? pageIndex * pageSize + rows.length : 0} of{" "}
            {total} rows
          </p>
          <nav aria-label={`${label} pages`} className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              Next
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
