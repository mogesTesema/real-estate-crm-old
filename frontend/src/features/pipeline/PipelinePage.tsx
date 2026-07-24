import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { api, apiError } from "../../lib/api";
import { compactMoney } from "../../lib/format";
import { useAction } from "../../lib/hooks";

interface Stage {
  id: string;
  name: string;
}
interface Opp {
  id: string;
  title: string;
  value: string;
  stage: string;
}
interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}
interface Column {
  stage: Stage;
  opportunities: Opp[];
}

function Card({ opp }: { opp: Opp }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opp.id,
    data: { opp },
  });
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={`rounded-md border border-border bg-card p-3 shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium">{opp.title}</div>
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      <div className="mt-1 text-sm font-semibold tabular text-primary">
        {compactMoney(opp.value)}
      </div>
    </div>
  );
}

function ColumnBox({ col }: { col: Column }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.stage.id });
  const total = col.opportunities.reduce((s, o) => s + Number(o.value || 0), 0);
  return (
    <div className="w-72 shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{col.stage.name}</span>
        <span className="text-xs text-muted-foreground tabular">
          {col.opportunities.length} · {compactMoney(total)}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[120px] space-y-2 rounded-lg border p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-border bg-muted/40"
        }`}
      >
        {col.opportunities.map((o) => (
          <Card key={o.id} opp={o} />
        ))}
      </div>
    </div>
  );
}

export function PipelinePage() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const move = useAction("opportunities");
  const [pending, setPending] = useState<{ opp: Opp; toStage: Stage } | null>(null);
  const [reason, setReason] = useState("");

  const pipelines = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => (await api.get("/pipelines/")).data.results as Pipeline[],
  });
  const pipelineId = pipelines.data?.[0]?.id;
  const stages = pipelines.data?.[0]?.stages ?? [];

  const board = useQuery({
    queryKey: ["board", pipelineId],
    enabled: !!pipelineId,
    queryFn: async () =>
      (await api.get(`/opportunities/board/?pipeline=${pipelineId}`)).data
        .columns as Column[],
  });

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
        body: { to_stage: pending.toStage.id, reason },
      });
      toast.success(`Moved to ${pending.toStage.name}`);
      setPending(null);
      setReason("");
      board.refetch();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag deals between stages. A reason is captured on every move."
      />
      {board.isLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 rounded-lg" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {board.data?.map((col) => (
              <ColumnBox key={col.stage.id} col={col} />
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
    </div>
  );
}
