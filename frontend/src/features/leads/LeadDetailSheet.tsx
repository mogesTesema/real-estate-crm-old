import { ArrowRight, Copy, PhoneCall } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ActivityTimeline } from "../../components/ActivityTimeline";
import { Avatar } from "../../components/ui/avatar";
import { SelectField } from "../../components/form/SelectField";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { api, apiError } from "../../lib/api";
import { money } from "../../lib/format";
import { useAction, useList } from "../../lib/hooks";
import { humanize, leadStatusTone } from "../../lib/status";
import { type Lead } from "./LeadsPage";

interface Pipeline {
  id: string;
  name: string;
  is_default?: boolean;
  stages: { id: string; name: string; order: number }[];
}
interface DupContact {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/** Possible duplicate contacts for this lead (SRS §3.1.10). */
function Duplicates({ lead }: { lead: Lead }) {
  const { data, isLoading } = useQuery({
    queryKey: ["contact-duplicates", lead.email, lead.phone, lead.name],
    queryFn: async () =>
      (
        await api.get<DupContact[]>("/contacts/duplicates/", {
          params: { email: lead.email, phone: lead.phone, name: lead.name },
        })
      ).data,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Checking…</p>;
  if (!data || data.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No matching contacts found — this looks like a new person.
      </p>
    );
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {data.length} existing contact{data.length > 1 ? "s" : ""} match this lead. Link
        activity to the existing record instead of creating a duplicate.
      </p>
      {data.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 rounded-md border border-border p-3"
        >
          <Avatar name={c.full_name || c.email} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{c.full_name || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {c.email} {c.phone && `· ${c.phone}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const respond = useAction("leads");
  const convert = useAction("leads");
  const assign = useAction("leads");
  const pipelines = useList<Pipeline>("pipelines");
  const agents = useList<{ id: string; full_name: string; email: string; role: string }>(
    "users",
    { page_size: 100 },
  );
  const [pipelineId, setPipelineId] = useState<string>();
  const [stageId, setStageId] = useState<string>();
  const [agentId, setAgentId] = useState<string>(lead.assigned_agent ?? "");

  const pipeline = pipelines.data?.results?.find((p) => p.id === pipelineId);
  const converted = !!lead.converted_opportunity;

  useEffect(() => {
    const list = pipelines.data?.results ?? [];
    if (list.length === 0) return;
    if (!pipelineId) {
      const first = list.find((p) => p.is_default) ?? list[0];
      setPipelineId(first.id);
      const stages = [...(first.stages ?? [])].sort((a, b) => a.order - b.order);
      if (stages[0]) setStageId(stages[0].id);
      return;
    }
    if (!stageId) {
      const p = list.find((x) => x.id === pipelineId);
      const stages = [...(p?.stages ?? [])].sort((a, b) => a.order - b.order);
      if (stages[0]) setStageId(stages[0].id);
    }
  }, [pipelines.data, pipelineId, stageId]);

  async function doRespond() {
    try {
      await respond.mutateAsync({ id: lead.id, action: "respond" });
      toast.success("First response logged — SLA clock stopped");
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  async function doConvert() {
    if (!pipelineId || !stageId) {
      toast.error("Pick a pipeline and stage");
      return;
    }
    try {
      await convert.mutateAsync({
        id: lead.id,
        action: "convert",
        body: { pipeline: pipelineId, stage: stageId },
      });
      toast.success("Lead converted to opportunity");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  async function doAssign() {
    if (!agentId) {
      toast.error("Pick an agent");
      return;
    }
    try {
      await assign.mutateAsync({
        id: lead.id,
        action: "assign",
        body: { assigned_agent: agentId },
      });
      toast.success("Lead assigned");
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{lead.name || lead.email || "Lead"}</SheetTitle>
          {/* 3-second scan strip */}
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatusBadge value={lead.status} tone={leadStatusTone[lead.status] ?? "muted"} />
                {lead.sla_breached && <StatusBadge value="SLA" tone="destructive" />}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Owner
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {(agents.data?.results ?? []).find((u) => u.id === lead.assigned_agent)?.full_name ||
                  "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Budget
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {lead.budget_max ? money(lead.budget_max) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Next action
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {lead.sla_breached
                  ? "Respond (SLA)"
                  : lead.status === "new"
                    ? "First contact"
                    : lead.status === "qualified"
                      ? "Convert to deal"
                      : humanize(lead.status)}
              </p>
            </div>
          </div>
        </SheetHeader>
        <SheetBody>
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="duplicates">
                <Copy className="mr-1 size-3.5" /> Duplicates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-lg border border-border p-3">
                <Row label="Email" value={lead.email || "—"} />
                <Row label="Phone" value={lead.phone || "—"} />
                <Row label="Type" value={humanize(lead.lead_type)} />
                <Row label="Source" value={humanize(lead.source)} />
                <Row label="Score" value={lead.score} />
                <Row label="Location" value={lead.preferred_location || "—"} />
                <Row label="Budget" value={lead.budget_max ? money(lead.budget_max) : "—"} />
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="text-sm font-medium">Assign agent</div>
                <SelectField
                  value={agentId || undefined}
                  onChange={setAgentId}
                  placeholder="Select agent"
                  options={(agents.data?.results ?? [])
                    .filter((u) => ["agent", "manager", "property_manager"].includes(u.role))
                    .map((u) => ({
                      value: u.id,
                      label: u.full_name || u.email,
                    }))}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={doAssign}
                  disabled={assign.isPending || !agentId}
                >
                  Save assignment
                </Button>
              </div>

              {!converted && (
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div className="text-sm font-medium">Convert to opportunity</div>
                  <SelectField
                    value={pipelineId}
                    onChange={(v) => {
                      setPipelineId(v);
                      setStageId(undefined);
                    }}
                    placeholder="Pipeline"
                    options={(pipelines.data?.results ?? []).map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                  />
                  {pipeline && (
                    <SelectField
                      value={stageId}
                      onChange={setStageId}
                      placeholder="Starting stage"
                      options={[...pipeline.stages]
                        .sort((a, b) => a.order - b.order)
                        .map((s) => ({ value: s.id, label: s.name }))}
                    />
                  )}
                </div>
              )}
              {converted && (
                <p className="rounded-md bg-success-subtle px-3 py-2 text-sm text-success">
                  Converted to an opportunity.
                </p>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <ActivityTimeline objectId={lead.id} />
            </TabsContent>

            <TabsContent value="duplicates">
              <Duplicates lead={lead} />
            </TabsContent>
          </Tabs>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={doRespond} disabled={respond.isPending}>
            <PhoneCall className="size-4" /> Log response
          </Button>
          {!converted && (
            <Button onClick={doConvert} disabled={convert.isPending}>
              Convert <ArrowRight className="size-4" />
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
