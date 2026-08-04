import { Mail, MessageSquare, Phone, StickyNote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";
import { apiError } from "../lib/api";
import { relativeTime } from "../lib/format";
import { useCreate, useList } from "../lib/hooks";
import { cn } from "../lib/cn";

export interface Activity {
  id: string;
  activity_type: string;
  body: string;
  at: string;
  actor: string | null;
  due_at?: string | null;
  completed_at?: string | null;
}

/**
 * Omnichannel timeline (design system §4C): channel-tinted left borders so
 * WhatsApp / email / calls / internal notes are visually distinct at a glance.
 */
const CHANNEL: Record<string, { border: string; bg: string; icon: typeof Mail; label: string }> = {
  whatsapp: { border: "border-l-emerald-500", bg: "bg-emerald-50/40 dark:bg-emerald-950/20", icon: MessageSquare, label: "WhatsApp" },
  sms: { border: "border-l-emerald-500", bg: "bg-emerald-50/40 dark:bg-emerald-950/20", icon: MessageSquare, label: "SMS" },
  email: { border: "border-l-blue-500", bg: "bg-blue-50/40 dark:bg-blue-950/20", icon: Mail, label: "Email" },
  call: { border: "border-l-purple-500", bg: "bg-purple-50/40 dark:bg-purple-950/20", icon: Phone, label: "Call" },
  note: { border: "border-l-amber-500", bg: "bg-amber-50/50 dark:bg-amber-950/20", icon: StickyNote, label: "Note" },
  meeting: { border: "border-l-slate-400", bg: "bg-muted/50", icon: Phone, label: "Meeting" },
  viewing: { border: "border-l-sky-500", bg: "bg-sky-50/40 dark:bg-sky-950/20", icon: Phone, label: "Viewing" },
  stage_change: { border: "border-l-blue-500", bg: "bg-blue-50/40 dark:bg-blue-950/20", icon: Phone, label: "Stage change" },
  task: { border: "border-l-slate-400", bg: "bg-muted/50", icon: Phone, label: "Task" },
};

export function ActivityTimeline({
  objectId,
  allowNote = true,
  limit,
}: {
  /** Related record UUID (contact / property / opportunity / lead). */
  objectId: string;
  /** Show the quick note composer. */
  allowNote?: boolean;
  limit?: number;
}) {
  const { data, isLoading } = useList<Activity>("activities", {
    object_id: objectId,
    page_size: limit ?? 50,
  });
  const create = useCreate("activities");
  const [note, setNote] = useState("");

  async function addNote() {
    if (!note.trim()) return;
    try {
      await create.mutateAsync({
        activity_type: "note",
        body: note.trim(),
        object_id: objectId,
      } as never);
      setNote("");
      toast.success("Note added");
    } catch (e) {
      toast.error(apiError(e, "Could not add note"));
    }
  }

  const rows = (data?.results ?? []).slice(0, limit ?? 50);

  return (
    <div className="space-y-3">
      {allowNote && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add an internal note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={addNote} disabled={!note.trim() || create.isPending}>
              Add note
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No activity yet. Notes, calls, and emails will appear here.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((a) => {
          const ch = CHANNEL[a.activity_type] ?? CHANNEL.note;
          return (
            <div
              key={a.id}
              className={cn("rounded-r-md border-l-4 p-3", ch.border, ch.bg)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ch.icon className="size-3.5" />
                  {ch.label}
                </span>
                <span className="text-xs text-muted-foreground">{relativeTime(a.at)}</span>
              </div>
              {a.body && <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
