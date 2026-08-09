import { Lock, Target } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Avatar } from "../../components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { compactMoney, money, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";

export interface Lead {
  id: string;
  name: string;
  email: string;
  source: string;
  status: string;
  score: number;
  sla_breached: boolean;
  assigned_agent: string | null;
  first_response_at?: string | null;
  created_at: string;
}
export interface Opp {
  id: string;
  status: string;
  stage: string;
  value: string;
  probability: number;
  assigned_agent: string | null;
}
export interface Stage {
  id: string;
  name: string;
  order: number;
}
export interface Pipeline {
  id: string;
  stages: Stage[];
}
export interface Activity {
  id: string;
  activity_type: string;
  body: string;
  at: string;
}
export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

/** Honest "coming in Phase N" panel for unbuilt doc-2 dashboard groups. */
export function StubPanel({
  title,
  phase,
  children,
}: {
  title: string;
  phase: number;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-muted-foreground">
          <Lock className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {children ?? (
          <p>
            Coming in Phase {phase}. This panel is a placeholder so the role dashboard matches
            the design doc layout.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function GoalProgressCard({
  won,
  target = 10,
}: {
  won: number;
  target?: number;
}) {
  const goalPct = Math.min(100, Math.round((won / target) * 100));
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular">
          {won} / {target} won
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${goalPct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{goalPct}% of monthly win target</p>
      </CardContent>
    </Card>
  );
}

export function SalesPipelineCard({
  title,
  data,
  loading,
}: {
  title: string;
  data: { name: string; value: number }[];
  loading?: boolean;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => (v >= 1000 ? compactMoney(v) : String(v))}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(v: number) => (v >= 1000 ? money(v) : v)}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** @deprecated use SalesPipelineCard */
export const ChartCard = SalesPipelineCard;

export function ActivityFeed({ mine }: { mine?: string }) {
  const activities = useList<Activity>("activities", {
    page_size: 8,
    ...(mine ? { actor: mine } : {}),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{mine ? "My recent activity" : "Recent activity"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.isLoading &&
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        {(activities.data?.results ?? []).map((a) => (
          <div key={a.id} className="flex gap-3">
            <Avatar name={a.activity_type} className="bg-muted text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm">{a.body || a.activity_type}</p>
              <p className="text-xs text-muted-foreground">{relativeTime(a.at)}</p>
            </div>
          </div>
        ))}
        {!activities.isLoading && (activities.data?.results?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function HotLeads({ agentId }: { agentId?: string }) {
  const leads = useList<Lead>("leads", { page_size: 100 });
  const hot = (leads.data?.results ?? [])
    .filter((l) => !agentId || l.assigned_agent === agentId)
    .filter((l) => l.sla_breached || l.score >= 70)
    .filter((l) => l.status !== "converted" && l.status !== "lost")
    .slice(0, 6);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4 text-destructive" /> Needs attention
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leads.isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        {hot.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{l.name || l.email}</span>
            <span
              className={
                l.sla_breached ? "text-xs font-medium text-destructive" : "text-xs text-warning"
              }
            >
              {l.sla_breached ? "SLA breached" : `Score ${l.score}`}
            </span>
          </div>
        ))}
        {!leads.isLoading && hot.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing urgent right now.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function FollowUpsDue({ agentId }: { agentId?: string }) {
  const leads = useList<Lead>("leads", { page_size: 100, sla_breached: true });
  const rows = (leads.data?.results ?? [])
    .filter((l) => !agentId || l.assigned_agent === agentId)
    .filter((l) => l.status !== "converted" && l.status !== "lost")
    .slice(0, 6);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-ups due</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leads.isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        {rows.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{l.name || l.email}</span>
            <span className="text-xs font-medium text-destructive">SLA</span>
          </div>
        ))}
        {!leads.isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No follow-ups overdue.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function TeamLeaderboard({
  opps,
  users,
  loading,
}: {
  opps: Opp[];
  users: UserRow[];
  loading?: boolean;
}) {
  const rows = useMemo(() => {
    const byAgent = new Map<string, { value: number; deals: number }>();
    for (const o of opps.filter((x) => x.status === "open" || x.status === "won")) {
      if (!o.assigned_agent) continue;
      const cur = byAgent.get(o.assigned_agent) ?? { value: 0, deals: 0 };
      cur.value += Number(o.value || 0);
      cur.deals += 1;
      byAgent.set(o.assigned_agent, cur);
    }
    return [...byAgent.entries()]
      .map(([id, stats]) => {
        const u = users.find((x) => x.id === id);
        return {
          id,
          name: u?.full_name || u?.email || "Agent",
          ...stats,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [opps, users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              <span className="mr-2 text-xs text-muted-foreground">{i + 1}.</span>
              {r.name}
            </span>
            <span className="shrink-0 tabular text-muted-foreground">
              {r.deals} · {compactMoney(r.value)}
            </span>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No assigned deals yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function useSalesData(meId: string, scope: "mine" | "team" | "all") {
  const leads = useList<Lead>("leads", { page_size: 200 });
  const opps = useList<Opp>("opportunities", { page_size: 200 });
  const pipelines = useList<Pipeline>("pipelines");
  const users = useList<UserRow>("users", { page_size: 100 });

  const leadRows = (leads.data?.results ?? []).filter((l) => {
    if (scope === "mine") return l.assigned_agent === meId;
    return true;
  });
  const oppRows = (opps.data?.results ?? []).filter((o) => {
    if (scope === "mine") return o.assigned_agent === meId;
    return true;
  });
  const stages = pipelines.data?.results?.[0]?.stages ?? [];
  const openDeals = oppRows.filter((o) => o.status === "open");
  const won = oppRows.filter((o) => o.status === "won");
  const pipelineValue = openDeals.reduce((s, o) => s + Number(o.value || 0), 0);
  const gci = won.reduce((s, o) => s + Number(o.value || 0), 0);
  const breaches = leadRows.filter((l) => l.sla_breached).length;
  const converted = leadRows.filter((l) => l.status === "converted").length;
  const conversion =
    leadRows.length > 0 ? Math.round((converted / leadRows.length) * 100) : 0;
  const weighted = openDeals.reduce(
    (s, o) => s + Number(o.value || 0) * ((o.probability || 0) / 100),
    0,
  );
  const chartData = [...stages]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      name: s.name,
      value: oppRows
        .filter((o) => o.stage === s.id && o.status === "open")
        .reduce((sum, o) => sum + Number(o.value || 0), 0),
    }));

  return {
    leads,
    opps,
    pipelines,
    users,
    leadRows,
    oppRows,
    openDeals,
    pipelineValue,
    gci,
    breaches,
    conversion,
    weighted,
    chartData,
  };
}
