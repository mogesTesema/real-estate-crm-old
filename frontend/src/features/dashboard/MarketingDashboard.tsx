import { CircleDollarSign, Target, UserCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useScopedDemoList } from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { SalesPipelineCard, type Lead } from "./widgets";

export function MarketingDashboard() {
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
