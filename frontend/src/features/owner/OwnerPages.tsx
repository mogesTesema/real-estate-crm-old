import {
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  GitBranch,
  MapPin,
  Megaphone,
  PieChart,
  Receipt,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useAuth } from "../../lib/auth";
import { useDemoMutate, useScopedDemoList } from "../../lib/demo";
import type {
  DemoAgentRow,
  DemoCampaign,
  DemoFieldSession,
  DemoVipClient,
} from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { humanize, type Tone } from "../../lib/status";
import { SalesPipelineCard, TeamLeaderboard, useSalesData } from "../dashboard/widgets";

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

function agentTone(status: string): Tone {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  return "muted";
}

function campaignTone(status: string): Tone {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  if (status === "paused") return "warning";
  return "muted";
}

export function OwnerAgentsPage() {
  const list = useScopedDemoList<DemoAgentRow>("agents", { page_size: 50 });
  const mutate = useDemoMutate("agents");
  const rows = list.data?.results ?? [];
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <ModuleDashboard
      title="Agents"
      description="Register and approve Sales / Leasing Agents under this agency. Branch managers register owners, not agents."
      stats={[
        { label: "Agents", value: rows.length, icon: Users, tone: "info", loading: list.isLoading },
        { label: "Pending", value: pending, icon: UserPlus, tone: pending ? "warning" : "muted" },
        { label: "Active", value: rows.filter((r) => r.status === "active").length, icon: Target, tone: "success" },
        { label: "Agency GCI (demo)", value: compactMoney(rows.reduce((n, r) => n + r.gci, 0)), icon: CircleDollarSign, tone: "primary" },
      ]}
      actions={
        <Can roles={["owner"]}>
          <Button
            className="min-h-[44px]"
            onClick={() => {
              mutate.upsert({
                id: `agt-${Date.now()}`,
                name: "New agent (demo)",
                email: `agent-${Date.now()}@demo.test`,
                deals: 0,
                gci: 0,
                conversion: 0,
                status: "pending",
              });
              toast.success("Agent invite queued (demo).");
            }}
          >
            Invite agent
          </Button>
        </Can>
      }
    >
      <Panel title="Agency agents" loading={list.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.email} · {row.deals} deals · {compactMoney(row.gci)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={row.status} tone={agentTone(row.status)} />
                {row.status === "pending" && (
                  <Can roles={["owner"]}>
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

export function OwnerGpsPage() {
  const list = useScopedDemoList<DemoFieldSession>("fieldSessions", { page_size: 50 });
  const rows = list.data?.results ?? [];
  const missing = rows.filter((r) => r.status === "missing").length;

  return (
    <ModuleDashboard
      title="Field GPS"
      description="Review GPS field sessions for agents under this agency. View only — capture stays with the agent."
      stats={[
        { label: "Sessions", value: rows.length, icon: MapPin, tone: "info", loading: list.isLoading },
        { label: "Compliant", value: rows.filter((r) => r.status === "compliant").length, icon: Target, tone: "success" },
        { label: "Missing track", value: missing, icon: AlertTriangle, tone: missing ? "destructive" : "muted" },
        { label: "Points logged", value: rows.reduce((n, r) => n + r.points, 0), icon: BarChart3, tone: "primary" },
      ]}
    >
      <Panel title="Agency sessions" loading={list.isLoading}>
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

export function OwnerVipClientsPage() {
  const list = useScopedDemoList<DemoVipClient>("vipClients", { page_size: 50 });
  const [params] = useSearchParams();
  const referralsOnly = params.get("view") === "referrals";
  const rows = (list.data?.results ?? []).filter((r) => (referralsOnly ? Boolean(r.referral) : true));

  return (
    <ModuleDashboard
      title={referralsOnly ? "Referral sources" : "High-value / VIP clients"}
      description="Agency VIP contacts and referral sources. Oversight only — not the agent's full contact book."
      stats={[
        { label: "VIP clients", value: (list.data?.results ?? []).filter((r) => r.vip).length, icon: Users, tone: "info", loading: list.isLoading },
        { label: "Pipeline value", value: compactMoney(rows.reduce((n, r) => n + r.value, 0)), icon: CircleDollarSign, tone: "success" },
        { label: "Referrals", value: (list.data?.results ?? []).filter((r) => r.referral).length, icon: GitBranch, tone: "primary" },
        { label: "Shown", value: rows.length, icon: Target, tone: "muted" },
      ]}
    >
      <Panel title={referralsOnly ? "Referral sources" : "VIP book"} loading={list.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.kind} · {row.email}
                  {row.referral ? ` · via ${row.referral}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.vip && <StatusBadge value="VIP" tone="warning" />}
                <span className="tabular text-sm">{compactMoney(row.value)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function OwnerCampaignsPage() {
  const list = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 50 });
  const mutate = useDemoMutate("campaigns");
  const rows = list.data?.results ?? [];
  const pending = rows.filter((r) => r.status === "draft").length;

  return (
    <ModuleDashboard
      title="Approve campaigns"
      description="Marketing oversight: approve or pause agency campaigns. Campaign build stays with Marketing Staff."
      stats={[
        { label: "Campaigns", value: rows.length, icon: Megaphone, tone: "info", loading: list.isLoading },
        { label: "Pending approve", value: pending, icon: Target, tone: pending ? "warning" : "muted" },
        { label: "Active", value: rows.filter((r) => r.status === "active").length, icon: TrendingUp, tone: "success" },
        { label: "Spend", value: compactMoney(rows.reduce((n, r) => n + r.spend, 0)), icon: CircleDollarSign, tone: "primary" },
      ]}
    >
      <Panel title="Campaign queue" loading={list.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.channel} · budget {compactMoney(row.budget)} · {row.leads} leads
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={row.status} tone={campaignTone(row.status)} />
                {row.status === "draft" && (
                  <Can roles={["owner"]}>
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
                {row.status === "active" && (
                  <Can roles={["owner"]}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => {
                        mutate.patch(row.id, { status: "paused" });
                        toast.success(`${row.name} paused (demo).`);
                      }}
                    >
                      Pause
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

export function OwnerReportsPage() {
  const { me } = useAuth();
  const d = useSalesData(me?.id ?? "", "all");
  const closedDeals = d.oppRows.filter((o) => o.status === "won").length;

  return (
    <ModuleDashboard
      title="Agency Reports"
      description="Agency-wide analytics from live leads, listings, and pipeline. Commission payouts stay with Finance."
      stats={[
        { label: "Closed GCI", value: compactMoney(d.gci), icon: CircleDollarSign, tone: "success", loading: d.opps.isLoading },
        { label: "Open pipeline", value: compactMoney(d.pipelineValue), icon: TrendingUp, tone: "primary", loading: d.opps.isLoading },
        { label: "Won deals", value: closedDeals, icon: Target, tone: "info", loading: d.opps.isLoading },
        { label: "Conversion", value: `${d.conversion}%`, icon: BarChart3, tone: "muted", loading: d.leads.isLoading },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionTile to="/leads/analytics" label="Lead analytics" icon={BarChart3} tone="info" />
        <ActionTile to="/properties/analytics" label="Listing analytics" icon={PieChart} tone="primary" />
        <ActionTile to="/pipeline/forecast" label="Pipeline forecast" icon={TrendingUp} tone="success" />
        <ActionTile to="/finance/reports" label="Financial reports" icon={Receipt} tone="warning" />
        <ActionTile to="/reports/leaderboard" label="Agent leaderboard" icon={Users} tone="muted" />
        <ActionTile to="/reports/roi" label="ROI reports" icon={Target} tone="primary" />
      </div>
      <SalesPipelineCard
        title="Agency pipeline"
        data={d.chartData}
        loading={d.pipelines.isLoading || d.opps.isLoading}
      />
      <TeamLeaderboard
        opps={d.oppRows}
        users={d.users.data?.results ?? []}
        loading={d.opps.isLoading || d.users.isLoading}
      />
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Figures come from live opportunities and leads (agency-wide in this single-company demo). Custom report builder and scheduled export are not built.
        </CardContent>
      </Card>
    </ModuleDashboard>
  );
}
