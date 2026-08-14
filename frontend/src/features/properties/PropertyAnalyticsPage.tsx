import { Building2, Clock, Home, KeyRound, Percent } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../lib/auth";
import { useScopedDemoList, type DemoLease } from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { humanize } from "../../lib/status";
import { type Listing, type Property } from "./PropertiesPage";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94A3B8",
  active: "#15803D",
  under_offer: "#B45309",
  reserved: "#2563EB",
  sold: "#2563EB",
  rented: "#0369A1",
  off_market: "#64748B",
  expired: "#94A3B8",
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const OCCUPIED_LEASE = new Set(["active", "expiring", "renewed"]);

/** Inventory composition, value, and aging (SRS §3.3 analytics). PM sees occupancy, not sales pipeline. */
export function PropertyAnalyticsPage() {
  const { me } = useAuth();
  if (me?.role === "property_manager") return <PmPropertyStatus />;
  return <ListingAnalytics />;
}

function PmPropertyStatus() {
  const properties = useList<Property>("properties", { page_size: 500 });
  const listings = useList<Listing>("listings", { listing_type: "rent", page_size: 500 });
  const leases = useScopedDemoList<DemoLease>("leases", { page_size: 100 });

  const units = (properties.data?.results ?? []).filter((p) => p.node_type === "property");
  const rentListed = listings.data?.results ?? [];
  const leaseRows = leases.data?.results ?? [];
  const occupied = leaseRows.filter((l) => OCCUPIED_LEASE.has(l.status)).length;
  const expiring = leaseRows.filter((l) => l.status === "expiring").length;
  const managed = Math.max(units.length, occupied);
  const vacant = Math.max(managed - occupied, 0);
  const occupancy = managed ? Math.round((occupied / managed) * 100) : 0;
  const chartData = [
    { name: "Occupied", value: occupied, key: "rented" },
    { name: "Vacant", value: vacant, key: "draft" },
    { name: "Expiring", value: expiring, key: "under_offer" },
  ];

  return (
    <div>
      <PageHeader
        title="Property status"
        description="Occupied vs vacant rental units — not sales listing pipeline."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Managed units" value={managed} icon={Building2} tone="info" loading={properties.isLoading} />
        <StatCard label="Occupied" value={occupied} icon={Home} tone="success" loading={leases.isLoading} />
        <StatCard label="Vacant" value={vacant} icon={KeyRound} tone={vacant ? "warning" : "muted"} />
        <StatCard
          label="Occupancy"
          value={`${occupancy}%`}
          icon={Percent}
          tone="primary"
          loading={leases.isLoading || properties.isLoading}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio mix</CardTitle>
          </CardHeader>
          <CardContent>
            {leases.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={STATUS_COLORS[d.key] ?? "#2563EB"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rent listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              For-rent listings <b>{rentListed.length}</b>
            </p>
            <p className="text-muted-foreground">
              Assignment (managed_by) is not on the API yet. Occupancy uses lease status, not sold or under-offer.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ListingAnalytics() {
  const listings = useList<Listing & { created_at: string }>("listings", { page_size: 500 });
  const properties = useList<Property>("properties", { page_size: 500 });

  const rows = listings.data?.results ?? [];
  const units = (properties.data?.results ?? []).filter((p) => p.node_type === "property");

  const active = rows.filter((l) => l.status === "active");
  const totalValue = rows
    .filter((l) => !["sold", "rented", "expired", "off_market"].includes(l.status))
    .reduce((s, l) => s + Number(l.price || 0), 0);
  const listedShare = units.length ? Math.round((rows.length / units.length) * 100) : 0;

  const byStatus = new Map<string, number>();
  for (const l of rows) byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
  const statusData = [...byStatus.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: humanize(name), value, key: name }));

  const now = Date.now();
  const buckets = { "<30d": 0, "30-60d": 0, "60-90d": 0, "90d+": 0 };
  for (const l of rows) {
    const days = (now - new Date(l.created_at).getTime()) / 86400000;
    if (days < 30) buckets["<30d"]++;
    else if (days < 60) buckets["30-60d"]++;
    else if (days < 90) buckets["60-90d"]++;
    else buckets["90d+"]++;
  }
  const agingData = Object.entries(buckets).map(([name, value]) => ({ name, value }));

  const byCategory = new Map<string, number>();
  const propCategory = new Map((properties.data?.results ?? []).map((p) => [p.id, p.category]));
  for (const l of rows) {
    const cat = propCategory.get(l.property) ?? "unknown";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }
  const categoryData = [...byCategory.entries()].map(([name, value]) => ({
    name: humanize(name),
    value,
  }));

  return (
    <div>
      <PageHeader
        title="Listing analytics"
        description="Inventory composition, value on market, and how long stock sits."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Units / properties" value={units.length} icon={Building2} tone="info" loading={properties.isLoading} />
        <StatCard label="Active listings" value={active.length} icon={Home} tone="success" loading={listings.isLoading} />
        <StatCard
          label="Value on market"
          value={compactMoney(totalValue)}
          icon={Percent}
          tone="primary"
          loading={listings.isLoading}
        />
        <StatCard
          label="Units listed"
          value={`${listedShare}%`}
          icon={Clock}
          tone="warning"
          loading={listings.isLoading || properties.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {[
          { title: "Listings by status", data: statusData, colored: true },
          { title: "Listing age distribution", data: agingData, colored: false },
          { title: "Listings by category", data: categoryData, colored: false },
        ].map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <CardTitle>{c.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {listings.isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={c.data} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        width={28}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {c.data.map((d) => (
                          <Cell
                            key={d.name}
                            fill={
                              c.colored
                                ? (STATUS_COLORS[
                                    (d as { key?: string }).key ?? d.name.toLowerCase().replace(/ /g, "_")
                                  ] ?? "#2563EB")
                                : "hsl(var(--primary))"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
