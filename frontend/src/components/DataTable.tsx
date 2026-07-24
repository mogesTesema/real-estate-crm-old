import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Search } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { TABLE_EMPTY } from "./tableEmpty";
import { Table, TD, TH, THead, TR } from "./ui/table";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  toolbar?: ReactNode;
}

// Reusable list view (SRS §4.1): search + sortable columns + loading + empty states.
export function DataTable<T>({
  data,
  columns,
  loading,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  onRowClick,
  empty,
  toolbar,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-3">
      {(onSearch || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onSearch ? (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder={searchPlaceholder}
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          ) : (
            <span />
          )}
          {toolbar}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card shadow-card">
        <Table>
          <THead>
            {table.getHeaderGroups().map((hg) => (
              <TR key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const sortable = h.column.getCanSort();
                  return (
                    <TH
                      key={h.id}
                      onClick={sortable ? h.column.getToggleSortingHandler() : undefined}
                      className={sortable ? "cursor-pointer select-none" : ""}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sortable && <ArrowUpDown className="size-3 opacity-50" />}
                      </span>
                    </TH>
                  );
                })}
              </TR>
            ))}
          </THead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TR key={`sk-${i}`} className="hover:bg-transparent">
                  {columns.map((_c, j) => (
                    <TD key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TD>
                  ))}
                </TR>
              ))}
            {!loading &&
              table.getRowModel().rows.map((row) => (
                <TR
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TD key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TD>
                  ))}
                </TR>
              ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {empty ?? TABLE_EMPTY}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
