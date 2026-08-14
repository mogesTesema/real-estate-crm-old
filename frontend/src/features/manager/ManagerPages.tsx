import {
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  GitBranch,
  MapPin,
  PieChart,
  Receipt,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useDemoMutate, useScopedDemoList } from "../../lib/demo";
import type { DemoAgentConflict, DemoBrokerOwner, DemoFieldSession } from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { humanize, type Tone } from "../../lib/status";

const TILE: Record<Tone, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  destructive: "bg-destructive-subtle text-destructive",
  info: "bg-info-subtle text-info",
  primary: "bg-primary-subtle text-primary",
  muted: "bg-muted text-muted-foreground",
  under_offer: "bg-under-offer-subtle text-under-offer",
  reserved: "bg-reserved-subtle text-reserved",
};

function ActionTile({
  to,
  label,
  icon: Icon,
  tone,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <Button variant="outline" className="h-auto min-h-[44px] justify-start gap-3 py-3" asChild>
      <Link to={to}>
        <span className={`flex size-9 items-center justify-center rounded-lg ${TILE[tone]}`}>
          <Icon className="size-4" />
        </span>
        <span className="text-left text-sm font-medium">{label}</span>
      </Link>
    </Button>
  );
}

function ownerTone(status: string): Tone {
  if (status === "active" || status === "approved") return "success";
  if (status === "pending") return "warning";
  return "muted";
}

function conflictTone(status: string): Tone {
  if (status === "resolved") return "success";
  if (status === "open") return "warning";
  return "info";
}

export function ManagerOwnersPage() {
  const list = useScopedDemoList<DemoBrokerOwner>("brokerOwners", { page_size: 50 });
  const mutate = useDemoMutate("brokerOwners");
  const rows = list.data?.results ?? [];
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <ModuleDashboard
      title="Register Owners"
      description="Register and approve Broker / Agency Owners under this branch. Owners register their own agents."
      stats={[
        { label: "Owners", value: rows.length, icon: Users, tone: "info", loading: list.isLoading },
        { label: "Pending", value: pending, icon: UserPlus, tone: pending ? "warning" : "muted" },
        { label: "Active", value: rows.filter((r) => r.status === "active").length, icon: Target, tone: "success" },
        { label: "Agents under owners", value: rows.reduce((n, r) => n + r.agents, 0), icon: Users, tone: "primary" },
      ]}
      actions={
        <Can roles={["manager"]}>
          <Button
            className="min-h-[44px]"
            onClick={() => {
              mutate.upsert({
                id: `own-${Date.now()}`,
                name: "New owner (demo)",
                email: `owner-${Date.now()}@demo.test`,
                agency: "Pending agency",
                agents: 0,
                status: "pending",
              });
              toast.success("Owner invite queued (demo).");
            }}
          >
            Invite owner
          </Button>
        </Can>
      }
    >
      <Panel title="Branch owners" loading={list.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.agency} · {row.email} · {row.agents} agents
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={row.status} tone={ownerTone(row.status)} />
                {row.status === "pending" && (
                  <Can roles={["manager"]}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => {
                        mutate.patch(row.id, { status: "active" });
                        toast.success(`${row.name} approved (demo).`);
                      }}
                    >
                      Approve
                    </Button>
                  </Can>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function ManagerConflictsPage() {
  const list = useScopedDemoList<DemoAgentConflict>("agentConflicts", { page_size: 50 });
  const mutate = useDemoMutate("agentConflicts");
  const rows = list.data?.results ?? [];
  const open = rows.filter((r) => r.status !== "resolved").length;

  return (
    <ModuleDashboard
      title="Conflicts"
      description="Resolve disputes between agents in this branch."
      stats={[
        { label: "Open", value: open, icon: AlertTriangle, tone: open ? "warning" : "success" },
        { label: "Investigating", value: rows.filter((r) => r.status === "investigating").length, icon: Target, tone: "info" },
        { label: "Resolved", value: rows.filter((r) => r.status === "resolved").length, icon: Users, tone: "success" },
        { label: "Total", value: rows.length, icon: GitBranch, tone: "muted" },
      ]}
    >
      <Panel title="Queue" loading={list.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.agents} · {row.related} · {relativeTime(row.updated_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={row.status} tone={conflictTone(row.status)} />
                {row.status !== "resolved" && (
                  <Can roles={["manager"]}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => {
                        mutate.patch(row.id, { status: "resolved" });
                        toast.success("Conflict marked resolved (demo).");
                      }}
                    >
                      Resolve
                    </Button>
                  </Can>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function ManagerGpsPage() {
  const list = useScopedDemoList<DemoFieldSession>("fieldSessions", { page_size: 50 });
  const rows = list.data?.results ?? [];
  const missing = rows.filter((r) => r.status === "missing").length;

  return (
    <ModuleDashboard
      title="Field GPS"
      description="Authorized sales-officer GPS field sessions for compliance. View only — capture stays with the agent."
      stats={[
        { label: "Sessions", value: rows.length, icon: MapPin, tone: "info", loading: list.isLoading },
        { label: "Compliant", value: rows.filter((r) => r.status === "compliant").length, icon: Target, tone: "success" },
        { label: "Missing track", value: missing, icon: AlertTriangle, tone: missing ? "destructive" : "muted" },
        { label: "Points logged", value: rows.reduce((n, r) => n + r.points, 0), icon: BarChart3, tone: "primary" },
      ]}
    >
      <Panel title="Recent sessions" loading={list.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TILE[row.status === "compliant" ? "success" : "destructive"]}`}>
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.agent}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.activity} · {relativeTime(row.started_at)} · {row.points} points
                  </p>
                </div>
              </div>
              <StatusBadge value={humanize(row.status)} tone={row.status === "compliant" ? "success" : "destructive"} />
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function ManagerReportsPage() {
  return (
    <ModuleDashboard
      title="Branch Reports"
      description="Branch revenue, closed deals, and commission summaries."
      stats={[
        { label: "Closed GCI", value: compactMoney(371000), icon: CircleDollarSign, tone: "success" },
        { label: "Open pipeline", value: compactMoney(1_240_000), icon: TrendingUp, tone: "primary" },
        { label: "Won deals", value: 17, icon: Target, tone: "info" },
        { label: "Period", value: "YTD", icon: BarChart3, tone: "muted" },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionTile to="/leads/analytics" label="Lead analytics" icon={BarChart3} tone="info" />
        <ActionTile to="/properties/analytics" label="Listing analytics" icon={PieChart} tone="primary" />
        <ActionTile to="/pipeline/forecast" label="Pipeline forecast" icon={TrendingUp} tone="success" />
        <ActionTile to="/finance/reports/commission" label="Commission summaries" icon={Receipt} tone="warning" />
        <ActionTile to="/reports/leaderboard" label="Agent leaderboard" icon={Users} tone="muted" />
        <ActionTile to="/team/performance" label="Performance reviews" icon={Target} tone="primary" />
      </div>
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Figures are a branch snapshot for oversight. Commission payouts live with Finance. Super Admin does not belong on this screen.
        </CardContent>
      </Card>
    </ModuleDashboard>
  );
}
