import {
  Building2,
  Calendar,
  FileText,
  Home,
  KeyRound,
  Target,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../lib/auth";
import {
  useScopedDemoList,
  type DemoCalendarEvent,
  type DemoFavorite,
  type DemoInvoice,
  type DemoLease,
  type DemoOwnerStatement,
  type DemoPortalDeal,
  type DemoSavedSearch,
  type DemoWorkOrder,
} from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { portalKindsForEmail } from "../../lib/roles";

export function PortalDashboard() {
  const { me } = useAuth();
  const kinds = portalKindsForEmail(me?.email);
  const has = (k: (typeof kinds)[number]) => kinds.includes(k);
  const tenant = has("tenant");
  const landlord = has("landlord");
  const buyerSeller = has("buyer") || has("seller");

  const calendar = useScopedDemoList<DemoCalendarEvent>("calendar", { page_size: 20 });
  const rent = useScopedDemoList<DemoInvoice>("rentInvoices", { page_size: 20 });
  const tenantLeases = useScopedDemoList<DemoLease>("leases", { leaseRole: "tenant", page_size: 20 });
  const landlordLeases = useScopedDemoList<DemoLease>("leases", { leaseRole: "landlord", page_size: 20 });
  const workOrders = useScopedDemoList<DemoWorkOrder>("workOrders", { page_size: 20 });
  const statements = useScopedDemoList<DemoOwnerStatement>("ownerStatements", { page_size: 20 });
  const deals = useScopedDemoList<DemoPortalDeal>("portalDeals", { page_size: 20 });
  const favorites = useScopedDemoList<DemoFavorite>("favorites", { page_size: 20 });
  const searches = useScopedDemoList<DemoSavedSearch>("savedSearches", { page_size: 20 });

  const nextEvent = calendar.data?.results?.[0];
  const lease = tenantLeases.data?.results?.[0];
  const rentRows = rent.data?.results ?? [];
  const overdue = rentRows.filter((r) => r.status === "overdue");
  const nextRent = overdue[0] ?? rentRows.find((r) => r.status === "issued");
  const openWos = (workOrders.data?.results ?? []).filter(
    (w) => !["completed", "cancelled"].includes(w.status),
  );
  const ownUnits = landlordLeases.data?.results ?? [];
  const occupied = ownUnits.filter((u) => ["active", "expiring", "renewed"].includes(u.status));
  const lastStatement = statements.data?.results?.[0];
  const dealRows = deals.data?.results ?? [];
  const activeDeals = dealRows.filter((d) => d.status !== "closed");

  const notifications = [
    ...overdue.map((r) => ({ id: `rent-${r.id}`, text: `Overdue rent ${r.number} · ${compactMoney(r.amount)}` })),
    ...dealRows
      .filter((d) => d.status === "offer")
      .map((d) => ({ id: `deal-${d.id}`, text: `Offer update: ${d.title}` })),
    ...(calendar.data?.results ?? []).slice(0, 2).map((e) => ({
      id: `cal-${e.id}`,
      text: `Upcoming: ${e.title}`,
    })),
  ].slice(0, 5);

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Your records only — after a completed contract.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tenant && (
          <>
            <StatCard label="Active lease" value={lease?.reference ?? "—"} icon={KeyRound} tone="info" />
            <StatCard
              label="Open work orders"
              value={openWos.length}
              icon={Wrench}
              tone={openWos.length ? "warning" : "muted"}
            />
          </>
        )}
        {landlord && (
          <>
            <StatCard label="Your units" value={ownUnits.length} icon={Building2} tone="primary" />
            <StatCard
              label="Occupied"
              value={ownUnits.length ? `${occupied.length}/${ownUnits.length}` : "—"}
              icon={Home}
              tone="success"
            />
          </>
        )}
        {buyerSeller && (
          <>
            <StatCard label="Saved searches" value={searches.data?.count ?? 0} icon={Target} tone="info" />
            <StatCard label="Favorites" value={favorites.data?.count ?? 0} icon={Home} tone="primary" />
            <StatCard label="Active deals" value={activeDeals.length} icon={TrendingUp} tone="success" />
          </>
        )}
        <StatCard label="Upcoming" value={calendar.data?.count ?? 0} icon={Calendar} tone="muted" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {tenant && (
          <Card>
            <CardHeader>
              <CardTitle>My lease</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lease ? (
                <>
                  <p>
                    {lease.property} · Unit {lease.unit}
                  </p>
                  <p className="text-muted-foreground">
                    Rent {compactMoney(lease.rent)}
                    {nextRent
                      ? ` · ${nextRent.status === "overdue" ? "overdue" : "next"} ${nextRent.number}`
                      : ""}
                  </p>
                  {openWos[0] && <p className="text-muted-foreground">Open: {openWos[0].title}</p>}
                </>
              ) : (
                <p className="text-muted-foreground">No signed lease on this account.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link to="/portal/lease/payments">Pay rent</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/portal/lease/maintenance">Submit maintenance</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/portal/lease/documents">Lease docs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {landlord && (
          <Card>
            <CardHeader>
              <CardTitle>My property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                {ownUnits.length} unit{ownUnits.length === 1 ? "" : "s"} · occupancy{" "}
                {ownUnits.length ? `${Math.round((occupied.length / ownUnits.length) * 100)}%` : "—"}
              </p>
              <p className="text-muted-foreground">
                Last statement net{" "}
                {lastStatement ? compactMoney(lastStatement.net) : "—"}
                {lastStatement ? ` · ${lastStatement.period}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link to="/portal/landlord/statements">Statements</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/portal/landlord/leases">Leases</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {buyerSeller && (
          <Card>
            <CardHeader>
              <CardTitle>My deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealRows.slice(0, 4).map((d) => (
                <div key={d.id} className="text-sm">
                  <p className="truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.status} · {relativeTime(d.updated_at)}
                  </p>
                </div>
              ))}
              {dealRows.length === 0 && (
                <p className="text-sm text-muted-foreground">No deals on this account.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link to="/portal/offers">Offers</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/portal/matches">Matches</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/portal/documents">Documents</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
              <Link to="/portal/notifications">All notifications</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents & schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {nextEvent ? (
              <p>
                Next: {nextEvent.title}
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {relativeTime(nextEvent.start)}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">Nothing scheduled.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/portal/documents">
                  <FileText className="mr-1 size-4" />
                  Documents
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/portal/schedule">
                  <Calendar className="mr-1 size-4" />
                  Schedule
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/portal/messages">Messages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
