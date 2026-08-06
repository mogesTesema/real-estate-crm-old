import { ArrowRight, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

/**
 * Reports hub (Phase 1): shortcuts to the live analytics surfaces.
 * Scheduled/email reports and custom report builder arrive in Phase 3.
 */
const REPORTS = [
  {
    to: "/leads/analytics",
    icon: BarChart3,
    title: "Lead analytics",
    description: "Volume by source, status funnel, SLA health, and 14-day trend.",
  },
  {
    to: "/properties/analytics",
    icon: PieChart,
    title: "Listing analytics",
    description: "Inventory by status and category, value on market, listing age.",
  },
  {
    to: "/pipeline/forecast",
    icon: TrendingUp,
    title: "Pipeline forecast",
    description: "Weighted open value by stage and by agent.",
  },
];

export function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Live analytics across leads, listings, and the pipeline."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.to} to={r.to}>
            <Card className="h-full transition-shadow hover:shadow-lg">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <r.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  Open <ArrowRight className="size-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
