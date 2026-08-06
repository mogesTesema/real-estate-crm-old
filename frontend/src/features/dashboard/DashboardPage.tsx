import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  Globe,
  Home,
  KeyRound,
  Percent,
  Server,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";
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
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../lib/auth";
import { compactMoney, money, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";
import type { RoleKey } from "../../lib/roles";

interface Lead {
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
interface Opp {
  id: string;
  status: string;
  stage: string;
  value: string;
  probability: number;
  assigned_agent: string | null;
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
interface PropertyRow {
  id: string;
  node_type: string;
}
interface ListingRow {
  id: string;
  status: string;
  price: string;
}
interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

function ChartCard({
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

function ActivityFeed({ mine }: { mine?: string }) {
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

function HotLeads({ agentId }: { agentId?: string }) {
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

function TeamLeaderboard({
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

function useSalesData(meId: string, scope: "mine" | "team" | "all") {
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

/** DASH-AG — my leads, open deals, activity, hot items. */
function AgentDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "mine");
  const tasks = useList<{ id: string; body: string; due_at: string | null }>("activities", {
    activity_type: "task",
    actor: meId,
    page_size: 100,
  });
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = (tasks.data?.results ?? []).filter(
    (t) => t.due_at && t.due_at.slice(0, 10) === today,
  );
  const responded = d.leadRows.filter((l) => l.first_response_at);
  const avgResponseHrs =
    responded.length === 0
      ? null
      : Math.round(
          (responded.reduce((sum, l) => {
            const start = new Date(l.created_at).getTime();
            const end = new Date(l.first_response_at!).getTime();
            return sum + (end - start) / 36e5;
          }, 0) /
            responded.length) *
            10,
        ) / 10;
  const won = d.oppRows.filter((o) => o.status === "won").length;
  const goalTarget = 10;
  const goalPct = Math.min(100, Math.round((won / goalTarget) * 100));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My leads" value={d.leadRows.length} icon={Users} tone="info" loading={d.leads.isLoading} />
        <StatCard label="My open deals" value={d.openDeals.length} icon={TrendingUp} tone="primary" loading={d.opps.isLoading} />
        <StatCard label="Today's tasks" value={todayTasks.length} icon={Target} tone="warning" loading={tasks.isLoading} />
        <StatCard
          label="Avg response"
          value={avgResponseHrs == null ? "—" : `${avgResponseHrs}h`}
          icon={AlertTriangle}
          tone="muted"
          loading={d.leads.isLoading}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="My pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular">
                {won} / {goalTarget} won
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${goalPct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{goalPct}% of monthly win target</p>
            </CardContent>
          </Card>
          <HotLeads agentId={meId} />
          <ActivityFeed mine={meId} />
        </div>
      </div>
    </>
  );
}

/** DASH-MG — team pipeline, open deals, follow-ups, activity. */
function ManagerDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "team");
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Team leads" value={d.leadRows.length} icon={Users} tone="info" loading={d.leads.isLoading} />
        <StatCard label="Open deals" value={d.openDeals.length} icon={TrendingUp} tone="primary" loading={d.opps.isLoading} />
        <StatCard label="Team pipeline" value={compactMoney(d.pipelineValue)} icon={CircleDollarSign} tone="success" loading={d.opps.isLoading} />
        <StatCard label="Follow-ups due" value={d.breaches} icon={AlertTriangle} tone={d.breaches > 0 ? "destructive" : "muted"} loading={d.leads.isLoading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Team pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <TeamLeaderboard
          opps={d.oppRows}
          users={d.users.data?.results ?? []}
          loading={d.opps.isLoading || d.users.isLoading}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <HotLeads />
        <ActivityFeed />
      </div>
    </>
  );
}

/** DASH-OW — GCI, pipeline, conversion, leaderboard, SLA. */
function OwnerDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "all");
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="GCI (won)" value={compactMoney(d.gci)} icon={CircleDollarSign} tone="success" loading={d.opps.isLoading} />
        <StatCard label="Pipeline value" value={compactMoney(d.pipelineValue)} icon={TrendingUp} tone="primary" loading={d.opps.isLoading} />
        <StatCard label="Conversion" value={`${d.conversion}%`} icon={Percent} tone="info" loading={d.leads.isLoading} />
        <StatCard label="SLA breaches" value={d.breaches} icon={AlertTriangle} tone={d.breaches > 0 ? "destructive" : "muted"} loading={d.leads.isLoading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Agency pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <TeamLeaderboard
          opps={d.oppRows}
          users={d.users.data?.results ?? []}
          loading={d.opps.isLoading || d.users.isLoading}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <HotLeads />
        <Card>
          <CardHeader>
            <CardTitle>Weighted forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular">{compactMoney(d.weighted)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open deals × stage probability. Full forecast on Pipeline → Forecast.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/** DASH-SA — system / tenant health stubs + live CRM KPIs. */
function SuperAdminDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "all");
  const users = useList<UserRow>("users", { page_size: 100 });
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active users" value={users.data?.count ?? users.data?.results?.length ?? 0} icon={Users} tone="info" loading={users.isLoading} />
        <StatCard label="Leads" value={d.leadRows.length} icon={Target} tone="primary" loading={d.leads.isLoading} />
        <StatCard label="Open pipeline" value={compactMoney(d.pipelineValue)} icon={CircleDollarSign} tone="success" loading={d.opps.isLoading} />
        <StatCard label="System" value="Healthy" icon={Server} tone="success" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings?tab=org">Users / org</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">Settings</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/leads">Leads</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tenant usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Multi-tenant health and usage metering expand in later phases.</p>
            <p>
              Live now: <b className="text-foreground">{d.leadRows.length}</b> leads,{" "}
              <b className="text-foreground">{d.openDeals.length}</b> open deals,{" "}
              <b className="text-foreground">{d.breaches}</b> SLA breaches.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/** DASH-PU — portal activity stub. */
function PortalDashboard() {
  const activities = useList<Activity>("activities", { page_size: 8 });
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inquiries" value="—" icon={Globe} tone="info" />
        <StatCard label="Saved searches" value="—" icon={Target} tone="muted" />
        <StatCard label="Viewings" value="—" icon={Home} tone="muted" />
        <StatCard label="Messages" value="—" icon={Users} tone="muted" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portal workspace</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Public search, listing detail, and inquiry flows ship with the portal module
            (Phase 4). Notifications and activity below use the shared timeline when available.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            {(activities.data?.results ?? []).slice(0, 5).map((a) => (
              <div key={a.id} className="text-sm">
                <p className="truncate">{a.body || a.activity_type}</p>
                <p className="text-xs text-muted-foreground">{relativeTime(a.at)}</p>
              </div>
            ))}
            {!activities.isLoading && (activities.data?.results?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PropertyManagerDashboard() {
  const props = useList<PropertyRow>("properties", { page_size: 200 });
  const listings = useList<ListingRow>("listings", { page_size: 200 });

  const units = (props.data?.results ?? []).filter((p) => p.node_type === "property");
  const rows = listings.data?.results ?? [];
  const byStatus = (s: string) => rows.filter((l) => l.status === s).length;
  const active = byStatus("active");
  const rented = byStatus("rented");
  const occupancy =
    active + rented > 0 ? Math.round((rented / (active + rented)) * 100) : 0;

  const chartData = [
    { name: "Active", value: active },
    { name: "Under Offer", value: byStatus("under_offer") },
    { name: "Rented", value: rented },
    { name: "Sold", value: byStatus("sold") },
    { name: "Draft", value: byStatus("draft") },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Properties / units" value={units.length} icon={Building2} tone="info" loading={props.isLoading} />
        <StatCard label="Active listings" value={active} icon={Home} tone="success" loading={listings.isLoading} />
        <StatCard label="Occupancy signal" value={`${occupancy}%`} icon={KeyRound} tone="primary" loading={listings.isLoading} />
        <StatCard label="Under offer" value={byStatus("under_offer")} icon={TrendingUp} tone="warning" loading={listings.isLoading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Listings by status" data={chartData} loading={listings.isLoading} />
        <Card>
          <CardHeader>
            <CardTitle>Leases & maintenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Expiring leases and open maintenance tickets arrive with Phase 2 / Phase 4.
            Occupancy above is estimated from active vs rented listings.
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function FinanceDashboard() {
  const opps = useList<Opp>("opportunities", { page_size: 200 });
  const rows = opps.data?.results ?? [];
  const won = rows.filter((o) => o.status === "won");
  const open = rows.filter((o) => o.status === "open");
  const wonValue = won.reduce((s, o) => s + Number(o.value || 0), 0);
  const openValue = open.reduce((s, o) => s + Number(o.value || 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Won deals" value={won.length} icon={CircleDollarSign} tone="success" loading={opps.isLoading} />
        <StatCard label="Won value" value={compactMoney(wonValue)} icon={TrendingUp} tone="success" loading={opps.isLoading} />
        <StatCard label="Open pipeline" value={compactMoney(openValue)} icon={CircleDollarSign} tone="primary" loading={opps.isLoading} />
        <StatCard label="Open deals" value={open.length} icon={Target} tone="info" loading={opps.isLoading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Commissions & invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Commission tracking, approval workflows, and VAT invoicing arrive with the
              finance module (Phase 3). Won-deal values above are live from the pipeline.
            </p>
          </CardContent>
        </Card>
        <ActivityFeed />
      </div>
    </>
  );
}

function MarketingDashboard() {
  const leads = useList<Lead>("leads", { page_size: 200 });
  const rows = leads.data?.results ?? [];
  const bySource = new Map<string, number>();
  for (const l of rows) bySource.set(l.source, (bySource.get(l.source) ?? 0) + 1);
  const chartData = [...bySource.entries()].map(([name, value]) => ({ name, value }));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={rows.length} icon={Users} tone="info" loading={leads.isLoading} />
        <StatCard
          label="Converted"
          value={rows.filter((l) => l.status === "converted").length}
          icon={UserCheck}
          tone="success"
          loading={leads.isLoading}
        />
        <StatCard
          label="Active sources"
          value={bySource.size}
          icon={Target}
          tone="primary"
          loading={leads.isLoading}
        />
        <StatCard
          label="Lost"
          value={rows.filter((l) => l.status === "lost").length}
          icon={AlertTriangle}
          tone="muted"
          loading={leads.isLoading}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Leads by source" data={chartData} loading={leads.isLoading} />
        <ActivityFeed />
      </div>
    </>
  );
}

export function DashboardPage() {
  const { me } = useAuth();
  const role = (me?.role ?? "agent") as RoleKey;
  const meId = me?.id ?? "";

  const subtitles: Partial<Record<RoleKey, string>> = {
    super_admin: "System health and tenant usage at a glance.",
    agent: "Your day at a glance — leads, deals, and what needs attention.",
    manager: "Your team's pipeline and performance at a glance.",
    owner: "Agency performance — GCI, pipeline, conversion, and risk.",
    property_manager: "Portfolio overview — listings and occupancy signals.",
    finance: "Financial overview from the live pipeline.",
    marketing: "Lead generation performance by source.",
    portal: "Your portal activity and notifications.",
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={subtitles[role] ?? "Your workspace at a glance."}
      />
      {role === "super_admin" ? (
        <SuperAdminDashboard meId={meId} />
      ) : role === "owner" ? (
        <OwnerDashboard meId={meId} />
      ) : role === "manager" ? (
        <ManagerDashboard meId={meId} />
      ) : role === "property_manager" ? (
        <PropertyManagerDashboard />
      ) : role === "finance" ? (
        <FinanceDashboard />
      ) : role === "marketing" ? (
        <MarketingDashboard />
      ) : role === "portal" ? (
        <PortalDashboard />
      ) : (
        <AgentDashboard meId={meId} />
      )}
    </div>
  );
}
