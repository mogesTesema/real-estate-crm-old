import { type ColumnDef } from "@tanstack/react-table";
import { FolderKanban, type LucideIcon } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "./ui/badge";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { useScopedDemoList } from "../lib/demo";
import type { DemoResource } from "../lib/demo";
import { compactMoney, relativeTime } from "../lib/format";
import { humanize, toneForStatus, type StatusDomain } from "../lib/status";

export type ColumnKind = "text" | "status" | "money" | "date" | "datetime" | "badge";

export interface ResourceColumn {
  key: string;
  header: string;
  kind?: ColumnKind;
  domain?: StatusDomain;
}

export interface ResourceListPageProps {
  title: string;
  description?: string;
  resource: DemoResource;
  columns: ResourceColumn[];
  statusDomain?: StatusDomain;
  statusParam?: string;
  entity?: "lead" | "property" | "deal" | "lease" | "finance" | "muted";
  icon?: LucideIcon;
  actions?: ReactNode;
  /** Extra fixed filter merged with URL params. */
  fixedFilter?: Record<string, unknown>;
  toolbar?: ReactNode;
}

function cellValue(
  row: Record<string, unknown>,
  col: ResourceColumn,
  statusDomain?: StatusDomain,
): ReactNode {
  const raw = row[col.key];
  const kind = col.kind ?? "text";
  if (raw == null || raw === "") return "—";
  if (kind === "status") {
    return (
      <StatusBadge
        value={humanize(String(raw))}
        tone={toneForStatus(String(raw), col.domain ?? statusDomain ?? "lead")}
      />
    );
  }
  if (kind === "money") return <span className="tabular-nums font-medium">{compactMoney(Number(raw))}</span>;
  if (kind === "date") return String(raw).slice(0, 10);
  if (kind === "datetime") return relativeTime(String(raw));
  if (kind === "badge") return <Badge className="bg-muted text-muted-foreground">{String(raw)}</Badge>;
  return String(raw);
}

export function ResourceListPage({
  title,
  description,
  resource,
  columns,
  statusDomain,
  statusParam = "status",
  entity = "muted",
  icon = FolderKanban,
  actions,
  fixedFilter,
  toolbar,
}: ResourceListPageProps) {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const status = params.get(statusParam) ?? undefined;
  const focusSearch = params.get("focus") === "search";

  useEffect(() => {
    if (!params.get("new")) return;
    toast.success(`Add ${title.toLowerCase()} (demo) — create persists in Round 2.`);
    const next = new URLSearchParams(params);
    next.delete("new");
    setParams(next, { replace: true });
  }, [params, setParams, title]);
  const filter = useMemo(
    () => ({
      ...fixedFilter,
      ...(status ? { status } : {}),
      q: q || undefined,
      page_size: 200,
    }),
    [fixedFilter, status, q],
  );

  const list = useScopedDemoList<Record<string, unknown> & { id: string }>(resource, filter);

  const defs = useMemo<ColumnDef<Record<string, unknown> & { id: string }>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        accessorKey: col.key,
        header: col.header,
        cell: ({ row }) => cellValue(row.original, col, statusDomain),
      })),
    [columns, statusDomain],
  );

  return (
    <div>
      <PageHeader title={title} description={description} actions={actions} />
      <DataTable
        data={list.data?.results ?? []}
        columns={defs}
        loading={list.isLoading}
        search={q}
        onSearch={setQ}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        autoFocusSearch={focusSearch}
        columnToggle
        viewKey={`demo-${resource}`}
        onRowClick={(row) => setSelected(row)}
        toolbar={toolbar}
        empty={
          <EmptyState icon={icon} title={`No ${title.toLowerCase()} yet`} entity={entity} />
        }
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{title.slice(0, -1) || "Record"} detail</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            {selected &&
              columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-4 border-b border-border/60 py-2 text-sm">
                  <span className="text-muted-foreground">{col.header}</span>
                  <span className="text-right font-medium">
                    {cellValue(selected, col, statusDomain)}
                  </span>
                </div>
              ))}
            <p className="pt-2 text-xs text-muted-foreground">
              Demo data for the frontend showcase — mutations stay in-browser.
            </p>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
