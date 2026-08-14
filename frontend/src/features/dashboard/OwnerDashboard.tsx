import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  GitBranch,
  MapPin,
  Megaphone,
  Percent,
  Receipt,
  Target,
  TrendingUp,
  UserPlus,
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
import { humanize } from "../../lib/status";
import {
  SalesPipelineCard,
  TeamLeaderboard,
  useSalesData,
} from "./widgets";

const QUICK_ACTIONS = [
  { to: "/team/agents", label: "Register agent", icon: UserPlus, tone: "bg-info-subtle text-info" },
  { to: "/leads/routing", label: "Lead assignment", icon: GitBranch, tone: "bg-primary-subtle text-primary" },
  { to: "/team/commission-plans", label: "Commission plans", icon: Receipt, tone: "bg-warning-subtle text-warning" },
  { to: "/team/gps", label: "Field GPS", icon: MapPin, tone: "bg-success-subtle text-success" },
  { to: "/marketing/campaigns", label: "Approve campaigns", icon: Megaphone, tone: "bg-muted text-muted-foreground" },
  { to: "/reports", label: "Agency reports", icon: Target, tone: "bg-destructive-subtle text-destructive" },
] as const;

interface ListingRow {
  id: string;
  status: string;
}

export function OwnerDashboard({ meId }: { meId: string }) {
  const d = useSalesData(meId, "all");
  const listings = useList<ListingRow>("properties", { page_size: 200 });
  const invoices = useScopedDemoList("invoices", { page_size: 50 });
  const commissions = useScopedDemoList("commissions", { page_size: 50 });
  const sessions = useScopedDemoList<DemoFieldSession>("fieldSessions", { page_size: 20 });
  const listingRows = listings.data?.results ?? [];
  const activeListings = listingRows.filter((p) => p.status === "active").length;
  const closedDeals = d.oppRows.filter((o) => o.status === "won").length;
  const pending = (commissions.data?.results ?? []).filter(
    (c) => (c as unknown as { status: string }).status === "pending_approval",
  ).length;
  const gpsRows = sessions.data?.results ?? [];
  const missingGps = gpsRows.filter((s) => s.status === "missing").length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="GCI (won)"
          value={compactMoney(d.gci)}
          icon={CircleDollarSign}
          tone="success"
          loading={d.opps.isLoading}
        />
        <StatCard
          label="Closed deals"
          value={closedDeals}
          icon={Target}
          tone="info"
          loading={d.opps.isLoading}
        />
        <StatCard
          label="Pipeline value"
          value={compactMoney(d.pipelineValue)}
          icon={TrendingUp}
          tone="primary"
          loading={d.opps.isLoading}
        />
        <StatCard
          label="Conversion"
          value={`${d.conversion}%`}
          icon={Percent}
          tone="info"
          loading={d.leads.isLoading}
        />
        <StatCard
          label="Active listings"
          value={activeListings}
          icon={Building2}
          tone="muted"
          loading={listings.isLoading}
        />
        <StatCard
          label="SLA breaches"
          value={d.breaches}
          icon={AlertTriangle}
          tone={d.breaches > 0 ? "destructive" : "muted"}
          loading={d.leads.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Can roles={["owner"]}>
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
            <CardTitle>Revenue summary</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/finance/reports">Reports</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold tabular">{compactMoney(d.gci)}</p>
            <p className="text-muted-foreground">Closed GCI from won deals.</p>
            <p>
              Invoices on file: <b className="tabular">{invoices.data?.count ?? 0}</b>
            </p>
            <p>
              Pending commissions: <b className={`tabular ${pending ? "text-warning" : ""}`}>{pending}</b>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SalesPipelineCard
          title="Agency pipeline by stage"
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
            <CardTitle>Commission plans</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/team/commission-plans">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Pending approval: <b className="tabular text-warning">{pending}</b>
            </p>
            <p className="text-muted-foreground">
              Owner sets plans (flat, tiered, splits). Payouts stay with Finance.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/finance/commissions">Commission queue</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Field GPS</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/team/gps">Sessions</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground">Compliant</span>
              <b className="tabular text-success">{gpsRows.length - missingGps}</b>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="size-4 text-destructive" /> Missing track
              </span>
              <b className={`tabular ${missingGps ? "text-destructive" : ""}`}>{missingGps}</b>
            </div>
            {gpsRows.slice(0, 3).map((row) => (
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
