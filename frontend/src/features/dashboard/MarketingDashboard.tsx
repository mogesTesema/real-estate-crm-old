import {
  CircleDollarSign,
  FileText,
  Globe,
  Mail,
  Megaphone,
  PieChart,
  Radio,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Can } from "../../components/RequireRole";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  useScopedDemoList,
  type DemoCampaign,
  type DemoLandingPage,
} from "../../lib/demo";
import { compactMoney } from "../../lib/format";

const QUICK_ACTIONS = [
  { to: "/marketing/campaigns?new=1", label: "New campaign", icon: Megaphone, tone: "bg-primary-subtle text-primary" },
  { to: "/marketing/email/drip", label: "Open drips", icon: Mail, tone: "bg-info-subtle text-info" },
  { to: "/marketing/website/landing", label: "Landing pages", icon: Globe, tone: "bg-success-subtle text-success" },
  { to: "/marketing/social/leads", label: "Lead ads", icon: Radio, tone: "bg-warning-subtle text-warning" },
  { to: "/marketing/reports/roi", label: "ROI report", icon: PieChart, tone: "bg-muted text-muted-foreground" },
  { to: "/marketing/brand", label: "Brand", icon: FileText, tone: "bg-primary-subtle text-primary" },
] as const;

export function MarketingDashboard() {
  const campaigns = useScopedDemoList<DemoCampaign>("campaigns", { page_size: 100 });
  const landing = useScopedDemoList<DemoLandingPage>("landingPages", { page_size: 100 });
  const rows = campaigns.data?.results ?? [];
  const pages = landing.data?.results ?? [];

  const active = rows.filter((c) => c.status === "active");
  const spend = rows.reduce((s, c) => s + Number(c.spend || 0), 0);
  const budget = rows.reduce((s, c) => s + Number(c.budget || 0), 0);
  const campLeads = rows.reduce((s, c) => s + Number(c.leads || 0), 0);
  const formLeads = pages.reduce((s, p) => s + Number(p.submissions || 0), 0);
  const cpl = compactMoney(spend / Math.max(campLeads, 1));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active campaigns" value={active.length} icon={Megaphone} tone="success" loading={campaigns.isLoading} />
        <StatCard label="Spend" value={compactMoney(spend)} icon={CircleDollarSign} tone="warning" />
        <StatCard label="Budget" value={compactMoney(budget)} icon={CircleDollarSign} tone="info" />
        <StatCard label="Campaign leads" value={campLeads} icon={Target} tone="primary" />
        <StatCard label="CPL" value={cpl} icon={PieChart} tone="primary" />
        <StatCard label="Form captures" value={formLeads} icon={Globe} tone="info" loading={landing.isLoading} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Can roles={["marketing"]}>
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
          <CardHeader>
            <CardTitle>Lead generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Campaign leads <b>{campLeads}</b> · Landing submissions <b>{formLeads}</b>
            </p>
            <p className="text-muted-foreground">Not the sales pipeline or agent lead board.</p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/marketing/leads">Open capture queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold tabular">
              {compactMoney(spend)} / {compactMoney(budget)}
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/marketing/reports/budget">Campaign budget</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ROI analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold tabular">{cpl}</p>
            <p className="text-muted-foreground">Cost per campaign lead</p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/marketing/reports/roi">Full ROI report</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Awaiting Owner approval: <b>{rows.filter((c) => c.status === "draft").length}</b>
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/marketing/campaigns?status=draft">Open drafts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
