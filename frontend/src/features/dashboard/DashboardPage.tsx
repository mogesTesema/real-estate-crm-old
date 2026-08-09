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
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../lib/auth";
import { compactMoney, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";
import type { RoleKey } from "../../lib/roles";
import {
  ActivityFeed,
  FollowUpsDue,
  GoalProgressCard,
  HotLeads,
  SalesPipelineCard,
  StubPanel,
  TeamLeaderboard,
  useSalesData,
  type Activity,
  type Opp,
  type UserRow,
  type Lead,
} from "./widgets";

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
        <SalesPipelineCard title="My pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <div className="space-y-4">
          <GoalProgressCard won={won} />
          <FollowUpsDue agentId={meId} />
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
        <SalesPipelineCard title="Team pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <TeamLeaderboard
          opps={d.oppRows}
          users={d.users.data?.results ?? []}
          loading={d.opps.isLoading || d.users.isLoading}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <HotLeads />
        <ActivityFeed />
        <StubPanel title="Branch revenue & commissions" phase={2} />
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
        <SalesPipelineCard title="Agency pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <TeamLeaderboard
          opps={d.oppRows}
          users={d.users.data?.results ?? []}
          loading={d.opps.isLoading || d.users.isLoading}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <HotLeads />
        <Card>
          <CardHeader>
            <CardTitle>Revenue summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular">{compactMoney(d.weighted)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Weighted forecast (open × probability). Full forecast on Pipeline → Forecast.
            </p>
          </CardContent>
        </Card>
        <StubPanel title="Team & finance modules" phase={2}>
          <p>Agent management, commission plans, and agency finance arrive in Phases 2–3.</p>
        </StubPanel>
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
        <SalesPipelineCard title="Pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
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
        <StubPanel title="System analytics" phase={2}>
          <p>
            Live now: <b className="text-foreground">{d.leadRows.length}</b> leads,{" "}
            <b className="text-foreground">{d.openDeals.length}</b> open deals,{" "}
            <b className="text-foreground">{d.breaches}</b> SLA breaches. Multi-tenant metering expands later.
          </p>
        </StubPanel>
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
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My activity</CardTitle>
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
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Portal notifications use the shared timeline when available. Full inbox ships in Phase 4.
          </CardContent>
        </Card>
        <StubPanel title="Documents & schedule" phase={4} />
      </div>
    </>
  );
}

function PropertyManagerDashboard() {
  const props = useList<{ id: string; node_type: string }>("properties", { page_size: 200 });
  const listings = useList<{ id: string; status: string; price: string }>("listings", {
    page_size: 200,
  });

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
        <StatCard label="Properties managed" value={units.length} icon={Building2} tone="info" loading={props.isLoading} />
        <StatCard label="Active listings" value={active} icon={Home} tone="success" loading={listings.isLoading} />
        <StatCard label="Occupancy rate" value={`${occupancy}%`} icon={KeyRound} tone="primary" loading={listings.isLoading} />
        <StatCard label="Under offer" value={byStatus("under_offer")} icon={TrendingUp} tone="warning" loading={listings.isLoading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SalesPipelineCard title="Listings by status" data={chartData} loading={listings.isLoading} />
        <StubPanel title="Leases & rent collection" phase={2} />
        <StubPanel title="Maintenance" phase={2} />
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
        <StatCard label="Revenue summary" value={compactMoney(wonValue)} icon={TrendingUp} tone="success" loading={opps.isLoading} />
        <StatCard label="Open pipeline" value={compactMoney(openValue)} icon={CircleDollarSign} tone="primary" loading={opps.isLoading} />
        <StatCard label="Pending payments" value="—" icon={Target} tone="muted" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <StubPanel title="Commissions" phase={3} />
        <StubPanel title="Invoices" phase={3} />
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
        <SalesPipelineCard title="Lead generation by source" data={chartData} loading={leads.isLoading} />
        <StubPanel title="Campaign overview" phase={2} />
        <StubPanel title="ROI analysis" phase={2} />
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
