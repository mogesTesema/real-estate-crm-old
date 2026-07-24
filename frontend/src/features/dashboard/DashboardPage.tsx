import { AlertTriangle, DollarSign, TrendingUp, Users } from "lucide-react";
import { type LucideIcon } from "lucide-react";
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
import { PageHeader } from "../../components/PageHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { compactMoney, money, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";

interface Lead {
  id: string;
  sla_breached: boolean;
}
interface Opp {
  id: string;
  status: string;
  stage: string;
  value: string;
}
interface Stage {
  id: string;
  name: string;
  order: number;
}
interface Pipeline {
  id: string;
  stages: Stage[];
}
interface Activity {
  id: string;
  activity_type: string;
  body: string;
  at: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-5" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-semibold tabular">{value}</div>
          )}
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const leads = useList<Lead>("leads", { page_size: 200 });
  const opps = useList<Opp>("opportunities", { page_size: 200 });
  const pipelines = useList<Pipeline>("pipelines");
  const activities = useList<Activity>("activities", { page_size: 8 });

  const leadRows = leads.data?.results ?? [];
  const oppRows = opps.data?.results ?? [];
  const stages = pipelines.data?.results?.[0]?.stages ?? [];

  const openDeals = oppRows.filter((o) => o.status === "open");
  const pipelineValue = openDeals.reduce((sum, o) => sum + Number(o.value || 0), 0);
  const breaches = leadRows.filter((l) => l.sla_breached).length;

  const chartData = [...stages]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      name: s.name,
      value: oppRows
        .filter((o) => o.stage === s.id && o.status === "open")
        .reduce((sum, o) => sum + Number(o.value || 0), 0),
    }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your pipeline at a glance — leads, deals, and what needs attention."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={leads.data?.count ?? 0}
          icon={Users}
          tone="bg-info/10 text-info"
          loading={leads.isLoading}
        />
        <StatCard
          label="Open deals"
          value={openDeals.length}
          icon={TrendingUp}
          tone="bg-primary/10 text-primary"
          loading={opps.isLoading}
        />
        <StatCard
          label="Pipeline value"
          value={compactMoney(pipelineValue)}
          icon={DollarSign}
          tone="bg-success/10 text-success"
          loading={opps.isLoading}
        />
        <StatCard
          label="SLA breaches"
          value={breaches}
          icon={AlertTriangle}
          tone="bg-destructive/10 text-destructive"
          loading={leads.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline value by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
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
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
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
      </div>
    </div>
  );
}
