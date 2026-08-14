import { Home, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useScopedDemoList } from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";

export function PortalDashboard() {
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
