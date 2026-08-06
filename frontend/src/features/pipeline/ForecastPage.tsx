import { ArrowLeft, CircleDollarSign, Gauge, Scale, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { cn } from "../../lib/cn";
import { compactMoney, money } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { type Pipeline } from "./PipelinePage";
import { type Opp } from "./DealDetailSheet";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

/**
 * Weighted forecast (SRS §3.4.6 / PIPE-05): open deal value discounted by
 * probability, grouped by stage and agent, with period filter + lost reasons.
 */
export function ForecastPage() {
  const [period, setPeriod] = useState<"30" | "90" | "365" | "all">("90");
  const opps = useList<
    Opp & {
      assigned_agent: string | null;
      expected_close: string | null;
      created_at: string;
      lost_reason?: string;
    }
  >("opportunities", { page_size: 500 });
  const pipelines = useList<Pipeline>("pipelines");
  const users = useList<{ id: string; full_name: string; email: string }>("users", {
    page_size: 200,
  });

  const stages = (pipelines.data?.results ?? []).flatMap((p) => p.stages);
  const userName = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users.data?.results ?? []) m.set(u.id, u.full_name || u.email);
    return m;
  }, [users.data]);

  const cutoff = useMemo(() => {
    if (period === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - Number(period));
    return d;
  }, [period]);

  const rows = useMemo(() => {
    return (opps.data?.results ?? []).filter((o) => {
      if (o.status !== "open") return false;
      if (!cutoff) return true;
      const ref = o.expected_close || o.created_at;
      return ref ? new Date(ref) >= cutoff : true;
    });
  }, [opps.data, cutoff]);

  const lost = useMemo(() => {
    const all = (opps.data?.results ?? []).filter((o) => o.status === "lost");
    const map = new Map<string, number>();
    for (const o of all) {
      const key = o.lost_reason?.trim() || "Unspecified";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [opps.data]);

  const weighted = (o: Opp) =>
    Number(o.weighted_value ?? (Number(o.value || 0) * (o.probability ?? 0)) / 100);

  const totalValue = rows.reduce((s, o) => s + Number(o.value || 0), 0);
  const totalWeighted = rows.reduce((s, o) => s + weighted(o), 0);
  const avgProbability = rows.length
    ? Math.round(rows.reduce((s, o) => s + (o.probability ?? 0), 0) / rows.length)
    : 0;

  const byStage = stages
    .map((s) => ({
      name: s.name,
      value: rows.filter((o) => o.stage === s.id).reduce((sum, o) => sum + weighted(o), 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const byAgent = new Map<string, number>();
  for (const o of rows) {
    const key = o.assigned_agent ?? "Unassigned";
    byAgent.set(key, (byAgent.get(key) ?? 0) + weighted(o));
  }
  const agentData = [...byAgent.entries()]
    .map(([id, value]) => ({
      name: id === "Unassigned" ? id : userName.get(id) ?? `…${id.slice(-6)}`,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Forecast"
        description="Weighted pipeline — what this period realistically closes."
        actions={
          <Button variant="outline" asChild>
            <Link to="/pipeline">
              <ArrowLeft className="size-4" /> Back to pipeline
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["30", "30 days"],
            ["90", "90 days"],
            ["365", "12 months"],
            ["all", "All open"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setPeriod(v)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              period === v
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open deals" value={rows.length} icon={TrendingUp} tone="info" loading={opps.isLoading} />
        <StatCard
          label="Total open value"
          value={compactMoney(totalValue)}
          icon={CircleDollarSign}
          tone="primary"
          loading={opps.isLoading}
        />
        <StatCard
          label="Weighted forecast"
          value={compactMoney(totalWeighted)}
          icon={Scale}
          tone="success"
          loading={opps.isLoading}
        />
        <StatCard
          label="Avg. probability"
          value={`${avgProbability}%`}
          icon={Gauge}
          tone="warning"
          loading={opps.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weighted value by stage</CardTitle>
          </CardHeader>
          <CardContent>
            {opps.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : byStage.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No open deals to forecast yet.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStage} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => compactMoney(v)}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weighted value by agent</CardTitle>
          </CardHeader>
          <CardContent>
            {opps.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : agentData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No assigned open deals yet.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => compactMoney(v)}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={88}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Lost-reason analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {lost.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No lost deals yet — reasons will appear here after losses are recorded.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lost} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
