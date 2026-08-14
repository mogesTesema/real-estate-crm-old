import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { GripVertical, Plus, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../lib/cn";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { compactMoney } from "../../lib/format";
import { useAction, useList } from "../../lib/hooks";
import { CreateDealSheet } from "./CreateDealSheet";
import { DealDetailSheet, type Opp } from "./DealDetailSheet";

export interface Stage {
  id: string;
  name: string;
  order: number;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
}
export interface Pipeline {
  id: string;
  name: string;
  business_line: string;
  is_default: boolean;
  stages: Stage[];
}
interface Column {
  stage: Stage;
  opportunities: Opp[];
}

type ViewFilter = "open" | "won" | "lost";

function Card({
  opp,
  agentName,
  contactName,
  selected,
  onSelect,
}: {
  opp: Opp;
  agentName?: string;
  contactName?: string;
  selected?: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opp.id,
    data: { opp },
  });
  const days = opp.days_in_stage ?? 0;
  const stale = days > 14;
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={cn(
        "min-h-[44px] rounded-md border bg-card p-3 shadow-card outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-1 ring-primary" : "border-border",
        isDragging && "scale-105 rotate-2 border-primary opacity-90 shadow-xl",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{opp.title}</div>
          {contactName && (
            <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {contactName}
            </span>
          )}
        </div>
        <button
          {...listeners}
          {...attributes}
          className="flex size-11 shrink-0 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Drag deal"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      <div className="mt-2 text-sm font-bold tabular-nums text-primary">
        {compactMoney(opp.value, opp.currency)}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Avatar name={agentName || "?"} className="size-6 text-[10px]" />
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            stale
              ? "bg-destructive-subtle text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          {days}d in stage
        </span>
      </div>
    </div>
  );
}

function ColumnBox({
  col,
  focusedId,
  agentNames,
  contactNames,
  onSelect,
  onOpen,
}: {
  col: Column;
  focusedId?: string;
  agentNames: Map<string, string>;
  contactNames: Map<string, string>;
  onSelect: (o: Opp) => void;
  onOpen: (o: Opp) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.stage.id });
  const total = col.opportunities.reduce((s, o) => s + Number(o.value || 0), 0);
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/70 p-3">
      <div className="sticky top-0 z-[1] mb-2 flex items-center justify-between gap-2 bg-muted/70 pb-1">
        <span className="truncate text-sm font-medium">{col.stage.name}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {col.opportunities.length}
          </span>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {compactMoney(total)}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[120px] flex-1 space-y-2 rounded-lg p-1 transition-colors",
          isOver && "border-2 border-dashed border-primary bg-primary-subtle/50",
        )}
      >
        {col.opportunities.map((o) => (
          <div
            key={o.id}
            onDoubleClick={() => onOpen(o)}
            className="cursor-pointer"
          >
            <Card
              opp={o}
              agentName={o.assigned_agent ? agentNames.get(o.assigned_agent) : undefined}
              contactName={o.contact ? contactNames.get(o.contact) : undefined}
              selected={focusedId === o.id}
              onSelect={() => onSelect(o)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PipelinePage({ businessLine }: { businessLine?: string } = {}) {
  const { me } = useAuth();
  const isAgent = me?.role === "agent";
  const meId = me?.id ?? "";
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const move = useAction("opportunities");
  const [params, setParams] = useSearchParams();
  const [pending, setPending] = useState<{ opp: Opp; toStage: Stage } | null>(null);
  const [reason, setReason] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Opp | null>(null);
  const [focused, setFocused] = useState<Opp | null>(null);
  const [pipelineId, setPipelineId] = useState<string>();
  const [view, setView] = useState<ViewFilter>("open");

  useEffect(() => {
    if (params.get("new")) {
      setCreating(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
    const status = params.get("status");
    if (status === "won" || status === "lost" || status === "open") {
      setView(status);
    }
  }, [params, setParams]);

  const pipelines = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => (await api.get("/pipelines/")).data.results as Pipeline[],
  });

  const users = useList<{ id: string; full_name: string; email: string }>("users", {
    page_size: 200,
  });
  const contacts = useList<{ id: string; full_name: string; email: string }>("contacts", {
    page_size: 200,
  });
  const agentNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users.data?.results ?? []) {
      m.set(u.id, u.full_name || u.email);
    }
    return m;
  }, [users.data]);
  const contactNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of contacts.data?.results ?? []) {
      m.set(c.id, c.full_name || c.email);
    }
    return m;
  }, [contacts.data]);

  // Default to the tenant's default pipeline, else the first matching business line.
  const activePipeline = useMemo(() => {
    const all = pipelines.data ?? [];
    const scoped = businessLine
      ? all.filter((p) => p.business_line === businessLine)
      : all;
    const pool = scoped.length ? scoped : all;
    return (
      pool.find((p) => p.id === pipelineId) ??
      pool.find((p) => p.is_default) ??
      pool[0]
    );
  }, [pipelines.data, pipelineId, businessLine]);

  const stages = useMemo(
    () => [...(activePipeline?.stages ?? [])].sort((a, b) => a.order - b.order),
    [activePipeline],
  );

  const board = useQuery({
    queryKey: ["board", activePipeline?.id],
    enabled: !!activePipeline,
    queryFn: async () =>
      (await api.get(`/opportunities/board/?pipeline=${activePipeline!.id}`)).data
        .columns as Column[],
  });

  // Won/lost lists come from the same board data, grouped by outcome.
  const columns = useMemo(() => {
    const cols = board.data ?? [];
    const byOutcome =
      view === "open"
        ? cols.filter((c) => !c.stage.is_won && !c.stage.is_lost)
        : cols.filter((c) => (view === "won" ? c.stage.is_won : c.stage.is_lost));
    if (!isAgent || !meId) return byOutcome;
    return byOutcome.map((c) => ({
      ...c,
      opportunities: c.opportunities.filter((o) => o.assigned_agent === meId),
    }));
  }, [board.data, view, isAgent, meId]);

  function onDragEnd(e: DragEndEvent) {
    const opp = e.active.data.current?.opp as Opp | undefined;
    const toStageId = e.over?.id as string | undefined;
    if (!opp || !toStageId || opp.stage === toStageId) return;
    const toStage = stages.find((s) => s.id === toStageId);
    if (toStage) setPending({ opp, toStage });
  }

  async function confirmMove() {
    if (!pending || !reason.trim()) return;
    try {
      await move.mutateAsync({
        id: pending.opp.id,
        action: "move_stage",
        body: { to_stage: pending.toStage.id, reason, next_action: nextAction },
      });
      toast.success(`Moved to ${pending.toStage.name}`);
      setPending(null);
      setReason("");
      setNextAction("");
      board.refetch();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag deals between stages, or select a card and move with the stage buttons. A reason is required on every move."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/pipeline/forecast">
                <TrendingUp className="size-4" /> Forecast
              </Link>
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New deal
            </Button>
          </>
        }
      />

      {focused && view === "open" && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Move <b className="text-foreground">{focused.title}</b> to:
          </span>
          {stages
            .filter((s) => s.id !== focused.stage)
            .map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant="outline"
                onClick={() => setPending({ opp: focused, toStage: s })}
              >
                {s.name}
              </Button>
            ))}
          <Button size="sm" variant="ghost" onClick={() => setSelected(focused)}>
            Open detail
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFocused(null)}>
            Clear
          </Button>
        </div>
      )}

      {/* Multi-pipeline switcher + outcome filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(pipelines.data ?? [])
            .filter((p) => !businessLine || p.business_line === businessLine)
            .map((p) => (
            <button
              key={p.id}
              onClick={() => setPipelineId(p.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activePipeline?.id === p.id
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-input">
          {(["open", "won", "lost"] as ViewFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "h-8 px-3 text-xs font-medium capitalize",
                view === v
                  ? v === "won"
                    ? "bg-success-subtle text-success"
                    : v === "lost"
                      ? "bg-destructive-subtle text-destructive"
                      : "bg-muted"
                  : "text-muted-foreground",
                v !== "open" && "border-l border-input",
              )}
            >
              {v === "open" ? "Open" : v === "won" ? "Won" : "Lost"}
            </button>
          ))}
        </div>
      </div>

      {board.isLoading || pipelines.isLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-2 rounded-xl bg-muted/70 p-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : columns.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {view === "open"
            ? "No stages yet. Create a pipeline with stages in the backend to get started."
            : `No ${view} deals yet.`}
        </p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map((col) => (
              <ColumnBox
                key={col.stage.id}
                col={col}
                focusedId={focused?.id}
                agentNames={agentNames}
                contactNames={contactNames}
                onSelect={setFocused}
                onOpen={setSelected}
              />
            ))}
          </div>
        </DndContext>
      )}

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move deal</DialogTitle>
          </DialogHeader>
          {pending && (
            <p className="mb-3 text-sm text-muted-foreground">
              Moving <b className="text-foreground">{pending.opp.title}</b> to{" "}
              <b className="text-foreground">{pending.toStage.name}</b>. Why?
            </p>
          )}
          <Textarea
            autoFocus
            placeholder="Reason (required)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Input
            className="mt-2"
            placeholder="Next action (optional)…"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button onClick={confirmMove} disabled={!reason.trim() || move.isPending}>
              Move deal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {creating && (
        <CreateDealSheet
          open={creating}
          onOpenChange={(o) => {
            setCreating(o);
            if (!o) board.refetch();
          }}
        />
      )}
      {selected && (
        <DealDetailSheet
          opp={selected}
          stages={stages}
          open={!!selected}
          onOpenChange={(o) => {
            if (!o) {
              setSelected(null);
              board.refetch();
            }
          }}
        />
      )}
    </div>
  );
}
