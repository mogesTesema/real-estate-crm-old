import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { leadStatusTone } from "../../lib/status";
import { useList } from "../../lib/hooks";
import { CaptureLeadSheet } from "./CaptureLeadSheet";
import { LeadDetailSheet } from "./LeadDetailSheet";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  lead_type: string;
  source: string;
  status: string;
  score: number;
  sla_breached: boolean;
  is_possible_duplicate: boolean;
  preferred_location: string;
  budget_max: string | null;
  assigned_agent: string | null;
  contact: string | null;
  converted_opportunity: string | null;
}

export function LeadsPage() {
  const [search, setSearch] = useState("");
  const [capture, setCapture] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const { data, isLoading } = useList<Lead>("leads", { search: search || undefined });

  const columns = useMemo<ColumnDef<Lead, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Lead",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name || "—"}</div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        ),
      },
      { accessorKey: "lead_type", header: "Type", cell: ({ getValue }) => String(getValue()).replace("_", " ") },
      { accessorKey: "source", header: "Source" },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ getValue }) => (
          <span className="font-medium tabular">{String(getValue())}</span>
        ),
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

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Capture, qualify, and convert inbound inquiries."
        actions={
          <Button onClick={() => setCapture(true)}>
            <Plus className="size-4" /> Capture lead
          </Button>
        }
      />
      <DataTable
        data={data?.results ?? []}
        columns={columns}
        loading={isLoading}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search leads…"
        onRowClick={setSelected}
        empty={
          <EmptyState
            icon={Users}
            title="No leads yet"
            description="Capture your first inquiry to start building the pipeline."
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
    </div>
  );
}
