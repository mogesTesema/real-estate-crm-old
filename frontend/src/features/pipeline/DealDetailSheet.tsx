import { CalendarClock, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActivityTimeline } from "../../components/ActivityTimeline";
import { Field } from "../../components/form/Field";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { apiError } from "../../lib/api";
import { date, money } from "../../lib/format";
import { useCreate, useDetail, useList, useUpdate } from "../../lib/hooks";
import { opportunityStatusTone } from "../../lib/status";
import { type Stage } from "./PipelinePage";

export interface Opp {
  id: string;
  title: string;
  value: string;
  currency: string;
  stage: string;
  status: string;
  contact: string;
  property: string | null;
  probability: number;
  expected_close: string | null;
  lost_reason: string;
  assigned_agent?: string | null;
  weighted_value?: number;
  days_in_stage?: number;
  stage_history?: {
    id: string;
    from_stage: string | null;
    to_stage: string | null;
    reason: string;
    next_action: string;
    at: string;
  }[];
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/** Deal 360: facts, edit, stage history, timeline (SRS §3.4). */
export function DealDetailSheet({
  opp,
  stages,
  open,
  onOpenChange,
}: {
  opp: Opp;
  stages: Stage[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  // Refetch full detail (stage_history isn't in board payloads).
  const full = useDetail<Opp>("opportunities", opp.id);
  const contact = useDetail<{ full_name: string; email: string }>("contacts", opp.contact);
  const property = useDetail<{ title: string }>(
    "properties",
    opp.property ?? undefined,
  );
  const update = useUpdate("opportunities");
  const tasks = useList<{
    id: string;
    body: string;
    due_at: string | null;
    completed_at: string | null;
    at: string;
  }>("activities", {
    activity_type: "task",
    object_id: opp.id,
    page_size: 50,
  });
  const createTask = useCreate("activities");
  const [taskBody, setTaskBody] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const [value, setValue] = useState(opp.value);
  const [probability, setProbability] = useState(String(opp.probability ?? 0));
  const [expectedClose, setExpectedClose] = useState(opp.expected_close ?? "");

  const detail = full.data ?? opp;
  const stageName = (id: string | null) =>
    stages.find((s) => s.id === id)?.name ?? (id ? "—" : "Start");

  async function save() {
    try {
      await update.mutateAsync({
        id: opp.id,
        value: Number(value || 0),
        probability: Number(probability || 0),
        expected_close: expectedClose || null,
      } as never);
      toast.success("Deal updated");
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <SheetTitle>{detail.title}</SheetTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusBadge
              value={detail.status}
              tone={opportunityStatusTone[detail.status] ?? "muted"}
            />
            <StatusBadge value={stageName(detail.stage)} tone="primary" />
          </div>
        </SheetHeader>
        <SheetBody>
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="history">Stage history</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-lg border border-border p-3">
                <Row
                  label="Value"
                  value={<span className="tabular">{money(detail.value, detail.currency)}</span>}
                />
                <Row
                  label="Weighted"
                  value={
                    <span className="tabular">
                      {money(
                        detail.weighted_value ??
                          (Number(detail.value || 0) * (detail.probability ?? 0)) / 100,
                        detail.currency,
                      )}
                    </span>
                  }
                />
                <Row label="Probability" value={`${detail.probability ?? 0}%`} />
                <Row
                  label="Expected close"
                  value={
                    detail.expected_close ? (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="size-3.5 text-muted-foreground" />
                        {date(detail.expected_close)}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <Row label="Contact" value={contact.data?.full_name ?? "…"} />
                <Row label="Property" value={property.data?.title ?? (detail.property ? "…" : "—")} />
                {detail.lost_reason && <Row label="Lost reason" value={detail.lost_reason} />}
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="text-sm font-medium">Update deal</div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Value">
                    <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
                  </Field>
                  <Field label="Probability %">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={probability}
                      onChange={(e) => setProbability(e.target.value)}
                    />
                  </Field>
                  <Field label="Expected close">
                    <Input
                      type="date"
                      value={expectedClose}
                      onChange={(e) => setExpectedClose(e.target.value)}
                    />
                  </Field>
                </div>
                <Button onClick={save} disabled={update.isPending} className="w-full">
                  {update.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-3">
              <div className="space-y-2 rounded-lg border border-border p-3">
                <Field label="New task">
                  <Input
                    value={taskBody}
                    onChange={(e) => setTaskBody(e.target.value)}
                    placeholder="Follow up with buyer…"
                  />
                </Field>
                <Field label="Due">
                  <Input
                    type="datetime-local"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                  />
                </Field>
                <Button
                  className="w-full"
                  disabled={createTask.isPending || !taskBody.trim()}
                  onClick={async () => {
                    try {
                      await createTask.mutateAsync({
                        activity_type: "task",
                        body: taskBody.trim(),
                        object_id: opp.id,
                        related_model: "opportunity",
                        due_at: taskDue ? new Date(taskDue).toISOString() : null,
                      } as never);
                      setTaskBody("");
                      setTaskDue("");
                      toast.success("Task added");
                    } catch (e) {
                      toast.error(apiError(e));
                    }
                  }}
                >
                  {createTask.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add task
                </Button>
              </div>
              {(tasks.data?.results ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No tasks on this deal yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(tasks.data?.results ?? []).map((t) => (
                    <li key={t.id} className="rounded-md border border-border px-3 py-2 text-sm">
                      <p className="font-medium">{t.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.due_at ? `Due ${date(t.due_at)}` : "No due date"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="history">
              {(detail.stage_history ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No stage moves yet. Drag the deal on the board to record history.
                </p>
              ) : (
                <ol className="space-y-3">
                  {detail.stage_history!.map((h) => (
                    <li key={h.id} className="rounded-md border border-border p-3 text-sm">
                      <p className="font-medium">
                        {stageName(h.from_stage)} → {stageName(h.to_stage)}
                      </p>
                      <p className="mt-1 text-muted-foreground">{h.reason}</p>
                      {h.next_action && (
                        <p className="mt-1 text-xs text-primary">Next: {h.next_action}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{date(h.at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <ActivityTimeline objectId={opp.id} />
            </TabsContent>
          </Tabs>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
