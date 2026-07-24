import { ArrowRight, PhoneCall } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { apiError } from "../../lib/api";
import { money } from "../../lib/format";
import { useAction, useList } from "../../lib/hooks";
import { leadStatusTone } from "../../lib/status";
import { type Lead } from "./LeadsPage";

interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; order: number }[];
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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
  const pipelines = useList<Pipeline>("pipelines");
  const [pipelineId, setPipelineId] = useState<string>();
  const [stageId, setStageId] = useState<string>();

  const pipeline = pipelines.data?.results?.find((p) => p.id === pipelineId);
  const converted = !!lead.converted_opportunity;

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{lead.name || lead.email || "Lead"}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={lead.status} tone={leadStatusTone[lead.status] ?? "muted"} />
            {lead.sla_breached && <StatusBadge value="SLA breached" tone="destructive" />}
            {lead.is_possible_duplicate && (
              <StatusBadge value="possible duplicate" tone="warning" />
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <Row label="Email" value={lead.email || "—"} />
            <Row label="Phone" value={lead.phone || "—"} />
            <Row label="Type" value={lead.lead_type.replace("_", " ")} />
            <Row label="Source" value={lead.source} />
            <Row label="Score" value={lead.score} />
            <Row label="Location" value={lead.preferred_location || "—"} />
            <Row label="Budget" value={lead.budget_max ? money(lead.budget_max) : "—"} />
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
            <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              Converted to an opportunity.
            </p>
          )}
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
