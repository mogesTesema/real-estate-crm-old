import { AlertTriangle, Gauge, UserCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { useList } from "../../lib/hooks";
import { humanize } from "../../lib/status";

interface Lead {
  id: string;
  source: string;
  status: string;
  lead_type: string;
  score: number;
  sla_breached: boolean;
  created_at: string;
}

const FUNNEL_ORDER = ["new", "contacted", "qualified", "converted"];
const FUNNEL_COLORS = ["#0369A1", "#2563EB", "#B45309", "#15803D"];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

function ChartShell({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-56 w-full" /> : <div className="h-56">{children}</div>}
      </CardContent>
    </Card>
  );
}

/** Lead volume, funnel, sources, and SLA health (SRS §3.1 analytics). */
export function LeadAnalyticsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const leads = useList<Lead>("leads", { page_size: 500 });

  const rows = useMemo(() => {
    const allRows = leads.data?.results ?? [];
    return allRows.filter((l) => {
      if (!l.created_at) return true;
      const d = l.created_at.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [leads.data?.results, from, to]);

  const total = rows.length;
  const converted = rows.filter((l) => l.status === "converted").length;
  const breaches = rows.filter((l) => l.sla_breached).length;
  const conversionRate = rows.length ? Math.round((converted / rows.length) * 100) : 0;

  const bySource = new Map<string, number>();
  for (const l of rows) bySource.set(l.source || "unknown", (bySource.get(l.source || "unknown") ?? 0) + 1);
  const sourceData = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: humanize(name), value }));

  const funnelData = FUNNEL_ORDER.map((s) => ({
    name: humanize(s),
    value: rows.filter((l) => l.status === s).length,
  }));

  // Daily volume for the last 14 days.
  const days: { name: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      name: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: rows.filter((l) => l.created_at?.slice(0, 10) === key).length,
    });
  }

  return (
    <div>
      <PageHeader
        title="Lead analytics"
        description="Where leads come from, how fast they move, and SLA health."
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        {(from || to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear dates
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={total} icon={Users} tone="info" loading={leads.isLoading} />
        <StatCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          icon={Gauge}
          tone="primary"
          loading={leads.isLoading}
        />
        <StatCard label="Converted" value={converted} icon={UserCheck} tone="success" loading={leads.isLoading} />
        <StatCard
          label="SLA breaches"
          value={breaches}
          icon={AlertTriangle}
          tone={breaches > 0 ? "destructive" : "muted"}
          loading={leads.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartShell title="Leads by source" loading={leads.isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title="Status funnel" loading={leads.isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={FUNNEL_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>

      <div className="mt-4">
        <ChartShell title="New leads — last 14 days" loading={leads.isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 2, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </div>
  );
}
