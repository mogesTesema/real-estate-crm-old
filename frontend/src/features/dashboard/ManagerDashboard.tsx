import {
  AlertTriangle,
  GitBranch,
  MapPin,
  Receipt,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Can } from "../../components/RequireRole";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  useScopedDemoList,
  type DemoAgentConflict,
  type DemoFieldSession,
} from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { humanize } from "../../lib/status";
import {
  SalesPipelineCard,
  TeamLeaderboard,
  useSalesData,
} from "./widgets";

const QUICK_ACTIONS = [
  { to: "/team/owners", label: "Register owner", icon: UserPlus, tone: "bg-info-subtle text-info" },
  { to: "/leads/routing", label: "Lead routing", icon: GitBranch, tone: "bg-primary-subtle text-primary" },
  { to: "/finance/commissions", label: "Review commissions", icon: Receipt, tone: "bg-warning-subtle text-warning" },
  { to: "/team/gps", label: "Field GPS", icon: MapPin, tone: "bg-success-subtle text-success" },
  { to: "/reports/leaderboard", label: "Leaderboard", icon: Target, tone: "bg-muted text-muted-foreground" },
] as const;

export function ManagerDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "team");
  const commissions = useScopedDemoList("commissions", { page_size: 50 });
  const sessions = useScopedDemoList<DemoFieldSession>("fieldSessions", { page_size: 20 });
  const conflicts = useScopedDemoList<DemoAgentConflict>("agentConflicts", { page_size: 20 });
  const pending = (commissions.data?.results ?? []).filter(
    (c) => (c as unknown as { status: string }).status === "pending_approval",
  ).length;
  const gpsRows = sessions.data?.results ?? [];
  const missingGps = gpsRows.filter((s) => s.status === "missing").length;
  const openConflicts = (conflicts.data?.results ?? []).filter((c) => c.status !== "resolved").length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Team leads"
          value={d.leadRows.length}
          icon={Users}
          tone="info"
          loading={d.leads.isLoading}
        />
        <StatCard
          label="Team pipeline"
          value={compactMoney(d.pipelineValue)}
          icon={TrendingUp}
          tone="primary"
          loading={d.opps.isLoading}
        />
        <StatCard
          label="Conversion"
          value={`${d.conversion}%`}
          icon={Target}
          tone="success"
          loading={d.leads.isLoading}
        />
        <StatCard
          label="Pending commissions"
          value={pending}
          icon={Receipt}
          tone={pending > 0 ? "warning" : "muted"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Can roles={["manager"]}>
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
              <Link to="/team/gps">Sessions</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sessions</span>
              <b className="tabular">{gpsRows.length}</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-success" /> Compliant
              </span>
              <b className="tabular text-success">{gpsRows.length - missingGps}</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="size-4 text-destructive" /> Missing track
              </span>
              <b className={`tabular ${missingGps ? "text-destructive" : ""}`}>{missingGps}</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Open conflicts</span>
              <b className={`tabular ${openConflicts ? "text-warning" : ""}`}>{openConflicts}</b>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SalesPipelineCard
          title="Team pipeline by stage"
          data={d.chartData}
          loading={d.pipelines.isLoading || d.opps.isLoading}
        />
        <TeamLeaderboard
          opps={d.oppRows}
          users={d.users.data?.results ?? []}
          loading={d.opps.isLoading || d.users.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commission oversight</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/finance/commissions">Review</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Pipeline value <b className="tabular">{compactMoney(d.pipelineValue)}</b>
            </p>
            <p>
              Pending approval: <b className="tabular text-warning">{pending}</b>
            </p>
            <p className="text-muted-foreground">
              Approve where authorized. Payouts stay with Finance.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent GPS sessions</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/team/gps">All sessions</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {gpsRows.slice(0, 4).map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.agent}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.activity}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge
                    value={humanize(row.status)}
                    tone={row.status === "compliant" ? "success" : "destructive"}
                  />
                  <span className="text-xs text-muted-foreground">{relativeTime(row.started_at)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
