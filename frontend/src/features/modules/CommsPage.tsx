import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { cn } from "../../lib/cn";
import { useScopedDemoList, type DemoMessage } from "../../lib/demo";
import { relativeTime } from "../../lib/format";
import { humanize } from "../../lib/status";

const channelStyle: Record<string, string> = {
  whatsapp: "border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20",
  email: "border-l-4 border-blue-500 bg-blue-50/30 dark:bg-blue-950/20",
  call: "border-l-4 border-purple-500 bg-purple-50/30 dark:bg-purple-950/20",
  sms: "border-l-4 border-sky-500 bg-sky-50/30 dark:bg-sky-950/20",
  note: "border-l-4 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20",
};

export function CommsPage() {
  const [params] = useSearchParams();
  const channel = params.get("channel") ?? undefined;
  const list = useScopedDemoList<DemoMessage>("messages", {
    ...(channel ? { channel } : {}),
    page_size: 100,
  });
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const all = list.data?.results ?? [];
    if (!q.trim()) return all;
    const needle = q.toLowerCase();
    return all.filter(
      (m) =>
        m.contact.toLowerCase().includes(needle) ||
        m.subject.toLowerCase().includes(needle) ||
        m.body.toLowerCase().includes(needle),
    );
  }, [list.data, q]);

  return (
    <div>
      <PageHeader
        title="Communications"
        description="Omnichannel timeline — email, SMS, WhatsApp, calls, and notes."
      />
      <div className="mb-4">
        <input
          className="h-10 w-full max-w-sm rounded-lg border border-input bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search messages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search messages"
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages"
          description="Outbound and inbound threads appear here."
          entity="lead"
        />
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <article
              key={m.id}
              className={cn(
                "rounded-lg border border-border p-4 shadow-card",
                channelStyle[m.channel] ?? "border-l-4 border-border",
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge value={humanize(m.channel)} tone="primary" />
                <StatusBadge value={m.direction} tone="muted" />
                <StatusBadge value={m.status} tone="info" />
                <span className="ml-auto text-xs text-muted-foreground">{relativeTime(m.at)}</span>
              </div>
              <p className="text-sm font-semibold">{m.contact}</p>
              <p className="text-sm text-foreground">{m.subject}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommsTemplatesPage() {
  return (
    <CommsTemplates />
  );
}

function CommsTemplates() {
  const list = useScopedDemoList("emailTemplates", { page_size: 100 });
  const rows = list.data?.results ?? [];
  return (
    <div>
      <PageHeader
        title="Message Templates"
        description="Reusable email, SMS, and WhatsApp templates."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((t) => {
          const row = t as {
            id: string;
            name: string;
            subject: string;
            channel: string;
            opens: number;
            clicks: number;
          };
          return (
            <div key={row.id} className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge value={humanize(row.channel)} tone="primary" />
              </div>
              <p className="font-medium">{row.name}</p>
              <p className="text-sm text-muted-foreground">{row.subject}</p>
              <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                Opens {row.opens} · Clicks {row.clicks}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
