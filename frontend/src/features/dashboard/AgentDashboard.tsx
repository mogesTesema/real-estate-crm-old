import {
  AlertTriangle,
  Building2,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  MapPin,
  Percent,
  Plus,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Can } from "../../components/RequireRole";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useScopedDemoList, type DemoFieldSession } from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";
import {
  ActivityFeed,
  FollowUpsDue,
  GoalProgressCard,
  HotLeads,
  SalesPipelineCard,
  useSalesData,
} from "./widgets";

const QUICK_ACTIONS = [
  { to: "/leads?new=1", label: "Add lead", icon: Plus, tone: "bg-info-subtle text-info" },
  { to: "/properties?new=1", label: "Add listing", icon: Building2, tone: "bg-primary-subtle text-primary" },
  { to: "/field/gps", label: "Start GPS", icon: MapPin, tone: "bg-success-subtle text-success" },
  { to: "/calendar?new=1", label: "Schedule viewing", icon: Calendar, tone: "bg-warning-subtle text-warning" },
  { to: "/portal/invite", label: "Invite portal", icon: Users, tone: "bg-muted text-muted-foreground" },
  { to: "/reports/my-commission", label: "My commission", icon: Receipt, tone: "bg-destructive-subtle text-destructive" },
] as const;

export function AgentDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "mine");
  const tasks = useList<{ id: string; body: string; due_at: string | null }>("activities", {
    activity_type: "task",
    actor: meId,
    page_size: 100,
  });
  const calendar = useScopedDemoList("calendar", { page_size: 20 });
  const sessions = useScopedDemoList<DemoFieldSession>("fieldSessions", { page_size: 20 });
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
  const won = d.oppRows.filter((o) => o.status === "won");
  const gpsRows = sessions.data?.results ?? [];
  const activeSession = gpsRows.find((s) => s.status === "active");

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="My leads" value={d.leadRows.length} icon={Users} tone="info" loading={d.leads.isLoading} />
        <StatCard
          label="Conversion"
          value={`${d.conversion}%`}
          icon={Percent}
          tone="success"
          loading={d.leads.isLoading}
        />
        <StatCard
          label="Pipeline value"
          value={compactMoney(d.pipelineValue)}
          icon={TrendingUp}
          tone="primary"
          loading={d.opps.isLoading}
        />
        <StatCard
          label="Closed GCI"
          value={compactMoney(d.gci)}
          icon={CircleDollarSign}
          tone="success"
          loading={d.opps.isLoading}
        />
        <StatCard
          label="Avg response"
          value={avgResponseHrs == null ? "—" : `${avgResponseHrs}h`}
          icon={AlertTriangle}
          tone={d.breaches > 0 ? "warning" : "muted"}
          loading={d.leads.isLoading}
        />
        <StatCard
          label="Today's tasks"
          value={todayTasks.length}
          icon={ClipboardList}
          tone="warning"
          loading={tasks.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Can roles={["agent"]}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {QUICK_ACTIONS.map((a) => (
                  <Button
                    key={a.to}
                    variant="outline"
                    className="h-auto min-h-[44px] justify-start gap-3 py-3"
                    asChild
                  >
                    <Link to={a.to}>
                      <span className={`flex size-9 items-center justify-center rounded-lg ${a.tone}`}>
                        <a.icon className="size-4" />
                      </span>
                      <span className="text-left text-sm font-medium">{a.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </Can>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Field GPS</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/field/gps">Track</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge
                value={activeSession ? "On — session active" : "Off"}
                tone={activeSession ? "success" : "destructive"}
              />
            </div>
            {activeSession ? (
              <p className="text-muted-foreground">{activeSession.activity}</p>
            ) : (
              <p className="text-muted-foreground">
                GPS must be on before a sale, viewing, or field visit.
              </p>
            )}
            <Button size="sm" variant={activeSession ? "outline" : "default"} asChild>
              <Link to="/field/gps">{activeSession ? "Open session" : "Start field session"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SalesPipelineCard
          title="My pipeline by stage"
          data={d.chartData}
          loading={d.pipelines.isLoading || d.opps.isLoading}
        />
        <div className="space-y-4">
          <GoalProgressCard won={won.length} />
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
