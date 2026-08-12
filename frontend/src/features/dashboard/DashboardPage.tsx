import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  FileText,
  Home,
  KeyRound,
  Percent,
  Receipt,
  Server,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Can } from "../../components/RequireRole";
import { useAuth } from "../../lib/auth";
import { useScopedDemoList } from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";
import type { RoleKey } from "../../lib/roles";
import {
  ActivityFeed,
  FollowUpsDue,
  GoalProgressCard,
  HotLeads,
  SalesPipelineCard,
  TeamLeaderboard,
  useSalesData,
  type UserRow,
  type Lead,
} from "./widgets";

/** Agent — My Performance / Goals / Today's Tasks. */
function AgentDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "mine");
  const tasks = useList<{ id: string; body: string; due_at: string | null }>("activities", {
    activity_type: "task",
    actor: meId,
    page_size: 100,
  });
  const calendar = useScopedDemoList("calendar", { page_size: 20 });
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
          <Card>
            <CardHeader>
              <CardTitle>Upcoming calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(calendar.data?.results ?? []).slice(0, 4).map((e) => {
                const row = e as unknown as { id: string; title: string; start: string };
                return (
                  <div key={row.id} className="flex justify-between gap-2">
                    <span className="truncate">{row.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(row.start)}</span>
                  </div>
                );
              })}
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/calendar">Open calendar</Link>
              </Button>
            </CardContent>
          </Card>
          <ActivityFeed mine={meId} />
        </div>
      </div>
    </>
  );
}

function ManagerDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "team");
  const commissions = useScopedDemoList("commissions", { page_size: 50 });
  const pending = (commissions.data?.results ?? []).filter(
    (c) => (c as unknown as { status: string }).status === "pending_approval",
  ).length;
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
        <Card>
          <CardHeader>
            <CardTitle>Commission oversight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Pipeline value <b className="tabular">{compactMoney(d.pipelineValue)}</b>
            </p>
            <p>
              Pending: <b className="tabular text-warning">{pending}</b> → Review
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/finance/commissions">Review commissions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function OwnerDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "all");
  const agents = useScopedDemoList("agents", { page_size: 50 });
  const invoices = useScopedDemoList("invoices", { page_size: 50 });
  const agentRows = (agents.data?.results ?? []) as unknown as {
    name: string;
    gci: number;
    conversion: number;
  }[];
  const topAgent = [...agentRows].sort((a, b) => b.gci - a.gci)[0];
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="GCI (won)" value={compactMoney(d.gci)} icon={CircleDollarSign} tone="success" loading={d.opps.isLoading} />
        <StatCard label="Pipeline value" value={compactMoney(d.pipelineValue)} icon={TrendingUp} tone="primary" loading={d.opps.isLoading} />
        <StatCard label="Conversion" value={`${d.conversion}%`} icon={Percent} tone="info" loading={d.leads.isLoading} />
        <StatCard label="SLA breaches" value={d.breaches} icon={AlertTriangle} tone={d.breaches > 0 ? "destructive" : "muted"} loading={d.leads.isLoading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Agency overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Open deals <b className="tabular">{d.openDeals.length}</b> · Leads{" "}
              <b className="tabular">{d.leadRows.length}</b>
            </p>
            <p className="text-muted-foreground">
              Weighted forecast {compactMoney(d.weighted)}. Agents tracked: {agents.data?.count ?? 0}.
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/reports">Agency reports</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular">{compactMoney(d.gci)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Closed GCI. Invoices on file: {invoices.data?.count ?? 0}.
            </p>
            <Button variant="link" className="mt-2 h-auto p-0" asChild>
              <Link to="/finance/reports">Financial reports</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Top agent: <b>{topAgent?.name ?? "—"}</b>
              {topAgent ? ` · ${compactMoney(topAgent.gci)}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/team/performance">Leaderboard</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/team/commission-plans">Commission plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SalesPipelineCard title="Agency pipeline by stage" data={d.chartData} loading={d.pipelines.isLoading || d.opps.isLoading} />
        <TeamLeaderboard
          opps={d.oppRows}
          users={d.users.data?.results ?? []}
          loading={d.opps.isLoading || d.users.isLoading}
        />
        <HotLeads />
      </div>
    </>
  );
}

function SuperAdminDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "all");
  const users = useList<UserRow>("users", { page_size: 100 });
  const tenants = useScopedDemoList("tenantsAccounts", { page_size: 50 });
  const mrr = (tenants.data?.results ?? []).reduce(
    (s, t) => s + Number((t as unknown as { mrr: number }).mrr || 0),
    0,
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active users" value={users.data?.count ?? users.data?.results?.length ?? 0} icon={Users} tone="info" loading={users.isLoading} />
        <StatCard label="Tenants" value={tenants.data?.count ?? 0} icon={Building2} tone="primary" />
        <StatCard label="Platform MRR" value={compactMoney(mrr)} icon={CircleDollarSign} tone="success" />
        <StatCard label="System" value="Healthy" icon={Server} tone="success" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col gap-1 py-4" asChild>
              <Link to="/admin/tenants">
                <Building2 className="size-5" />
                <span>Create tenant</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1 py-4" asChild>
              <Link to="/admin/users">
                <Users className="size-5" />
                <span>Invite user</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1 py-4" asChild>
              <Link to="/admin/audit">
                <FileText className="size-5" />
                <span>View audit log</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Live CRM: <b className="text-foreground">{d.leadRows.length}</b> leads,{" "}
              <b className="text-foreground">{d.openDeals.length}</b> open deals,{" "}
              <b className="text-foreground">{d.breaches}</b> SLA breaches.
            </p>
            <Can roles={["super_admin"]}>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link to="/admin/roles">Roles & permissions</Link>
              </Button>
            </Can>
            <Button variant="link" className="mt-2 block h-auto p-0" asChild>
              <Link to="/admin/analytics">Open analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PortalDashboard() {
  const favorites = useScopedDemoList("favorites", { page_size: 20 });
  const deals = useScopedDemoList("portalDeals", { page_size: 20 });
  const searches = useScopedDemoList("savedSearches", { page_size: 20 });
  const calendar = useScopedDemoList("calendar", { page_size: 20 });
  const rent = useScopedDemoList("rentInvoices", { page_size: 20 });
  const notifications = [
    ...(rent.data?.results ?? [])
      .filter((r) => (r as unknown as { status: string }).status === "overdue")
      .map((r) => {
        const row = r as unknown as { id: string; number: string; amount: number };
        return { id: `rent-${row.id}`, text: `Overdue rent ${row.number} · ${compactMoney(row.amount)}` };
      }),
    ...(deals.data?.results ?? [])
      .filter((d) => (d as unknown as { status: string }).status === "offer")
      .map((d) => {
        const row = d as unknown as { id: string; title: string };
        return { id: `deal-${row.id}`, text: `Offer update: ${row.title}` };
      }),
    ...(calendar.data?.results ?? []).slice(0, 2).map((e) => {
      const row = e as unknown as { id: string; title: string };
      return { id: `cal-${row.id}`, text: `Upcoming: ${row.title}` };
    }),
  ].slice(0, 5);
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Saved searches" value={searches.data?.count ?? 0} icon={Target} tone="info" />
        <StatCard label="Favorites" value={favorites.data?.count ?? 0} icon={Home} tone="primary" />
        <StatCard label="Active deals" value={(deals.data?.results ?? []).filter((d) => (d as unknown as { status: string }).status !== "closed").length} icon={TrendingUp} tone="success" />
        <StatCard label="Upcoming" value={calendar.data?.count ?? 0} icon={Users} tone="muted" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(deals.data?.results ?? []).slice(0, 5).map((d) => {
              const row = d as unknown as { id: string; title: string; status: string; updated_at: string };
              return (
                <div key={row.id} className="text-sm">
                  <p className="truncate">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.status} · {relativeTime(row.updated_at)}
                  </p>
                </div>
              );
            })}
            {(deals.data?.results?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No deals yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground">No alerts right now.</p>
            ) : (
              notifications.map((n) => (
                <p key={n.id} className="truncate">
                  {n.text}
                </p>
              ))
            )}
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/portal/deals">View my deals</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documents & schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/portal/documents">Documents</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/portal/schedule">Schedule</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/portal/lease">My lease</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PropertyManagerDashboard() {
  const props = useList<{ id: string; node_type: string }>("properties", { page_size: 200 });
  const listings = useList<{ id: string; status: string; price: string }>("listings", {
    page_size: 200,
  });
  const leases = useScopedDemoList("leases", { page_size: 100 });
  const workOrders = useScopedDemoList("workOrders", { page_size: 100 });
  const rentInvoices = useScopedDemoList("rentInvoices", { page_size: 100 });

  const units = (props.data?.results ?? []).filter((p) => p.node_type === "property");
  const rows = listings.data?.results ?? [];
  const byStatus = (s: string) => rows.filter((l) => l.status === s).length;
  const leaseRows = leases.data?.results ?? [];
  const activeLeases = leaseRows.filter((l) =>
    ["active", "expiring", "renewed"].includes((l as unknown as { status: string }).status),
  ).length;
  const occupancy =
    leaseRows.length > 0 ? Math.round((activeLeases / leaseRows.length) * 100) : 0;
  const openWo = (workOrders.data?.results ?? []).filter(
    (w) => !["completed", "cancelled"].includes((w as unknown as { status: string }).status),
  ).length;
  const overdue = (rentInvoices.data?.results ?? []).filter(
    (i) => (i as unknown as { status: string }).status === "overdue",
  ).length;

  const chartData = [
    { name: "Active", value: byStatus("active") },
    { name: "Under Offer", value: byStatus("under_offer") },
    { name: "Rented", value: byStatus("rented") },
    { name: "Sold", value: byStatus("sold") },
    { name: "Draft", value: byStatus("draft") },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Properties managed" value={units.length} icon={Building2} tone="info" loading={props.isLoading} />
        <StatCard label="Occupancy rate" value={`${occupancy}%`} icon={KeyRound} tone="primary" />
        <StatCard label="Open work orders" value={openWo} icon={Wrench} tone="warning" />
        <StatCard label="Late payments" value={overdue} icon={AlertTriangle} tone={overdue ? "destructive" : "muted"} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold tabular">{occupancy}%</p>
            <p className="text-muted-foreground">
              {activeLeases} occupied of {leaseRows.length} lease records.
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/reports/occupancy">Occupancy report</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leases & rent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Active leases <b>{activeLeases}</b> · Expiring{" "}
              <b>
                {leaseRows.filter((l) => (l as unknown as { status: string }).status === "expiring").length}
              </b>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/leases">Leases</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/rent/late">Late payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Open work orders <b>{openWo}</b>
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/maintenance">Work orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <SalesPipelineCard title="Listings by status" data={chartData} loading={listings.isLoading} />
      </div>
    </>
  );
}

function FinanceDashboard() {
  const commissions = useScopedDemoList("commissions", { page_size: 100 });
  const invoices = useScopedDemoList("invoices", { page_size: 100 });
  const transactions = useScopedDemoList("transactions", { page_size: 100 });
  const comRows = commissions.data?.results ?? [];
  const invRows = invoices.data?.results ?? [];
  const pending = comRows.filter((c) => (c as unknown as { status: string }).status === "pending_approval");
  const overdue = invRows.filter((i) => (i as unknown as { status: string }).status === "overdue");
  const pendingPayments = invRows.filter((i) =>
    ["issued", "partially_paid"].includes((i as unknown as { status: string }).status),
  );
  const revenue = invRows
    .filter((i) => (i as unknown as { status: string }).status === "paid")
    .reduce((s, i) => s + Number((i as unknown as { amount: number }).amount || 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (paid)" value={compactMoney(revenue)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Pending commissions" value={pending.length} icon={Receipt} tone="warning" />
        <StatCard label="Overdue invoices" value={overdue.length} icon={FileText} tone={overdue.length ? "destructive" : "muted"} />
        <StatCard label="Pending payments" value={pendingPayments.length} icon={TrendingUp} tone="primary" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pending.slice(0, 4).map((c) => {
              const row = c as unknown as { id: string; agent: string; net: number };
              return (
                <div key={row.id} className="flex justify-between">
                  <span>{row.agent}</span>
                  <span className="tabular">{compactMoney(row.net)}</span>
                </div>
              );
            })}
            <Can roles={["finance", "owner", "super_admin"]}>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/finance/commissions?status=pending_approval">Approve pending</Link>
              </Button>
            </Can>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Issued / partial invoices awaiting funds: <b>{pendingPayments.length}</b>
            </p>
            <p className="text-muted-foreground">
              Overdue needing chase: <b>{overdue.length}</b>
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/finance/invoices?status=issued">Open invoices</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash movement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Transactions on file: <b>{transactions.data?.count ?? 0}</b>
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/finance/transactions">All transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MarketingDashboard() {
  const leads = useList<Lead>("leads", { page_size: 200 });
  const campaigns = useScopedDemoList("campaigns", { page_size: 50 });
  const rows = leads.data?.results ?? [];
  const campRows = campaigns.data?.results ?? [];
  const bySource = new Map<string, number>();
  for (const l of rows) bySource.set(l.source, (bySource.get(l.source) ?? 0) + 1);
  const chartData = [...bySource.entries()].map(([name, value]) => ({ name, value }));
  const spend = campRows.reduce((s, c) => s + Number((c as unknown as { spend: number }).spend || 0), 0);
  const budget = campRows.reduce((s, c) => s + Number((c as unknown as { budget: number }).budget || 0), 0);
  const campLeads = campRows.reduce((s, c) => s + Number((c as unknown as { leads: number }).leads || 0), 0);

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
        <StatCard label="Campaign spend" value={compactMoney(spend)} icon={CircleDollarSign} tone="warning" />
        <StatCard label="Campaign leads" value={campLeads} icon={Target} tone="primary" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SalesPipelineCard title="Lead generation by source" data={chartData} loading={leads.isLoading} />
        <Card>
          <CardHeader>
            <CardTitle>Campaign budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold tabular">
              {compactMoney(spend)} / {compactMoney(budget)}
            </p>
            <p className="text-muted-foreground">Spend vs budget across active campaigns.</p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/marketing/campaigns">Manage campaigns</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ROI analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-2xl font-semibold tabular">
              {compactMoney(spend / Math.max(campLeads, 1))}
            </p>
            <p className="text-muted-foreground">Cost per lead (campaigns)</p>
            <Button variant="link" className="mt-2 h-auto p-0" asChild>
              <Link to="/marketing/reports/roi">Full ROI report</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function DashboardPage() {
  const { me } = useAuth();
  const role = (me?.role ?? "agent") as RoleKey;
  const meId = me?.id ?? "";

  const titles: Partial<Record<RoleKey, string>> = {
    super_admin: "System Overview",
    agent: "My Performance",
    manager: "Branch Overview",
    owner: "Agency Overview",
    property_manager: "Portfolio Overview",
    finance: "Financial Overview",
    marketing: "Campaign Overview",
    portal: "My Activity",
  };

  const subtitles: Partial<Record<RoleKey, string>> = {
    super_admin: "Configuration, users, security, and billing at a glance.",
    agent: "Your day — leads, deals, goals, and what needs attention.",
    manager: "Team pipeline, performance, and branch KPIs.",
    owner: "Agency revenue, GCI, closed deals, and team performance.",
    property_manager: "Occupancy, leases, rent collection, and maintenance.",
    finance: "Commissions, invoices, and pending payments.",
    marketing: "Campaign performance, lead generation, and ROI.",
    portal: "Your deals, documents, lease, and notifications.",
  };

  return (
    <div>
      <PageHeader
        title={titles[role] ?? "Dashboard"}
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
