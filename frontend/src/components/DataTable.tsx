import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, BookmarkPlus, Columns3, Search, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { TABLE_EMPTY } from "./tableEmpty";
import { Table, TD, TH, THead, TR } from "./ui/table";
import { deleteView, listViews, saveView, type SavedView } from "../lib/savedViews";

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
  /** Enables the column show/hide menu. */
  columnToggle?: boolean;
  /** Enables saved views (SRS §4.1). Key namespaces views per resource. */
  viewKey?: string;
  /** Current page-owned filter/search state to persist inside a view. */
  viewState?: Record<string, unknown>;
  /** Apply a saved view's state back to the page. */
  onApplyView?: (state: Record<string, unknown>) => void;
}

// Reusable list view (SRS §4.1): search + sort + column config + saved views.
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
  columnToggle,
  viewKey,
  viewState = {},
  onApplyView,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const [views, setViews] = useState<SavedView[]>([]);

  useEffect(() => {
    if (viewKey) setViews(listViews(viewKey));
  }, [viewKey]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility: visibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const currentState = useCallback(
    () => ({
      ...viewState,
      sorting,
      visibility,
    }),
    [viewState, sorting, visibility],
  );

  function applyView(view: SavedView) {
    const { sorting: s, visibility: v, ...rest } = view.state as {
      sorting?: SortingState;
      visibility?: VisibilityState;
    };
    setSorting(s ?? []);
    setVisibility(v ?? {});
    onApplyView?.(rest);
  }

  function promptSave() {
    const name = window.prompt("Name this view:");
    if (!name?.trim() || !viewKey) return;
    saveView(viewKey, name.trim(), currentState());
    setViews(listViews(viewKey));
    toast.success(`View "${name.trim()}" saved`);
  }

  function removeView(view: SavedView) {
    if (!viewKey) return;
    deleteView(viewKey, view.id);
    setViews(listViews(viewKey));
  }

  return (
    <div className="space-y-3">
      {(onSearch || toolbar || columnToggle || viewKey) && (
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
          <div className="flex items-center gap-2">
            {toolbar}
            {columnToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns3 className="size-4" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllLeafColumns()
                    .filter((c) => c.getCanHide())
                    .map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onSelect={(e) => {
                          e.preventDefault();
                          c.toggleVisibility(!c.getIsVisible());
                        }}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={c.getIsVisible()}
                          className="size-3.5 accent-[hsl(var(--primary))]"
                        />
                        <span className="capitalize">{c.id.replace(/_/g, " ")}</span>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {viewKey && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="size-4" /> Views
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={promptSave}>
                    <BookmarkPlus className="size-4" /> Save current view
                  </DropdownMenuItem>
                  {views.length > 0 && <DropdownMenuSeparator />}
                  {views.map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      className="justify-between"
                      onClick={() => applyView(v)}
                    >
                      <span className="truncate">{v.name}</span>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeView(v);
                        }}
                        aria-label={`Delete view ${v.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  {views.length === 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      No saved views yet.
                    </p>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      <div className="max-h-[min(70vh,720px)] overflow-auto rounded-lg border border-border bg-card shadow-card">
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
