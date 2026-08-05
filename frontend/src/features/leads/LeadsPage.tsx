import { type ColumnDef } from "@tanstack/react-table";
import { Flame, GitMerge, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { SelectField } from "../../components/form/SelectField";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { LEAD_SOURCES, LEAD_TYPES } from "../../lib/constants";
import { money } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { leadStatusTone } from "../../lib/status";
import { CaptureLeadSheet } from "./CaptureLeadSheet";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { MergeLeadsDialog } from "./MergeLeadsDialog";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  lead_type: string;
  source: string;
  status: string;
  score: number;
  budget_max: string | null;
  preferred_location: string;
  assigned_agent: string | null;
  contact: string | null;
  sla_breached: boolean;
  is_possible_duplicate: boolean;
  converted_opportunity: string | null;
  created_at: string;
}

const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

type QuickTab = "all" | "hot" | "followups" | "converted";

export function LeadsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<QuickTab>("all");
  const [status, setStatus] = useState("");
  const [leadType, setLeadType] = useState("");
  const [source, setSource] = useState("");
  const [assignee, setAssignee] = useState("");
  const [capture, setCapture] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [merging, setMerging] = useState(false);

  // Command palette quick-create (?new=1).
  useEffect(() => {
    if (params.get("new")) {
      setCapture(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const { data, isLoading } = useList<Lead>("leads", {
    search: search || undefined,
    status: status || undefined,
    lead_type: leadType || undefined,
    source: source || undefined,
    assigned_agent: assignee || undefined,
    sla_breached: tab === "followups" ? true : undefined,
    page_size: 200,
  });
  const agents = useList<{ id: string; full_name: string; email: string }>("users", {
    page_size: 100,
  });

  const rows = useMemo(() => {
    const all = data?.results ?? [];
    if (tab === "hot")
      return all.filter(
        (l) => (l.sla_breached || l.score >= 70) && l.status !== "converted" && l.status !== "lost",
      );
    if (tab === "converted") return all.filter((l) => l.status === "converted");
    return all;
  }, [data, tab]);

  const columns = useMemo<ColumnDef<Lead, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Lead",
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-1.5 font-medium">
              {row.original.name || "—"}
              {row.original.score >= 70 && row.original.status !== "converted" && (
                <Flame className="size-3.5 text-warning" aria-label="Hot lead" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "lead_type",
        header: "Type",
        cell: ({ getValue }) => String(getValue()).replace("_", " "),
      },
      { accessorKey: "source", header: "Source" },
      {
        accessorKey: "budget_max",
        header: "Budget",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? <span className="tabular">{money(v)}</span> : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ getValue }) => <span className="font-medium tabular">{String(getValue())}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const v = String(getValue());
          return <StatusBadge value={v} tone={leadStatusTone[v] ?? "muted"} />;
        },
      },
      {
        accessorKey: "sla_breached",
        header: "SLA",
        cell: ({ getValue }) =>
          getValue() ? (
            <StatusBadge value="breached" tone="destructive" />
          ) : (
            <StatusBadge value="on track" tone="success" />
          ),
      },
    ],
    [],
  );

  const viewState = { search, tab, status, leadType, source, assignee };

  function applyView(state: Record<string, unknown>) {
    setSearch(String(state.search ?? ""));
    setTab((state.tab as QuickTab) ?? "all");
    setStatus(String(state.status ?? ""));
    setLeadType(String(state.leadType ?? ""));
    setSource(String(state.source ?? ""));
    setAssignee(String(state.assignee ?? ""));
  }

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Capture, qualify, and convert inbound inquiries."
        actions={
          <>
            <Button variant="outline" onClick={() => setMerging(true)}>
              <GitMerge className="size-4" /> Duplicates
            </Button>
            <Button onClick={() => setCapture(true)}>
              <Plus className="size-4" /> Capture lead
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as QuickTab)}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="all">All leads</TabsTrigger>
            <TabsTrigger value="hot">
              <Flame className="mr-1 size-3.5 text-warning" /> Hot
            </TabsTrigger>
            <TabsTrigger value="followups">Follow-ups due</TabsTrigger>
            <TabsTrigger value="converted">Converted</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap gap-2">
            <SelectField
              value={status}
              onChange={setStatus}
              placeholder="Status"
              options={LEAD_STATUSES}
              className="w-32"
            />
            <SelectField
              value={leadType}
              onChange={setLeadType}
              placeholder="Type"
              options={LEAD_TYPES}
              className="w-32"
            />
            <SelectField
              value={source}
              onChange={setSource}
              placeholder="Source"
              options={LEAD_SOURCES}
              className="w-36"
            />
            <SelectField
              value={assignee}
              onChange={setAssignee}
              placeholder="Assignee"
              options={(agents.data?.results ?? []).map((u) => ({
                value: u.id,
                label: u.full_name || u.email,
              }))}
              className="w-40"
            />
            {(status || leadType || source || assignee) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setLeadType("");
                  setSource("");
                  setAssignee("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search leads…"
        onRowClick={setSelected}
        columnToggle
        viewKey="leads"
        viewState={viewState}
        onApplyView={applyView}
        empty={
          <EmptyState
            icon={Users}
            title="No leads match"
            description="Adjust filters or capture a new inquiry to build the pipeline."
            action={
              <Button onClick={() => setCapture(true)}>
                <Plus className="size-4" /> Capture lead
              </Button>
            }
          />
        }
      />

      <CaptureLeadSheet
        open={capture}
        onOpenChange={setCapture}
        onCaptured={() => toast.success("Lead captured and assigned")}
      />
      {selected && (
        <LeadDetailSheet
          lead={selected}
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
        />
      )}
      <MergeLeadsDialog open={merging} onOpenChange={setMerging} />
    </div>
  );
}
