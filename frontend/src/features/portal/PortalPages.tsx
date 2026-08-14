import {
  Bell,
  Building2,
  Calendar,
  CircleDollarSign,
  CreditCard,
  FileText,
  KeyRound,
  MessageSquare,
  Receipt,
  Target,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { ResourceListPage } from "../../components/ResourceListPage";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../lib/auth";
import {
  useDemoMutate,
  useScopedDemoList,
  type DemoCalendarEvent,
  type DemoDocument,
  type DemoFavorite,
  type DemoInvoice,
  type DemoLease,
  type DemoMessage,
  type DemoOwnerStatement,
  type DemoPayment,
  type DemoPortalDeal,
  type DemoSavedSearch,
  type DemoWorkOrder,
} from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { humanize } from "../../lib/status";

function useOwnLeases(role: "tenant" | "landlord") {
  return useScopedDemoList<DemoLease>("leases", { leaseRole: role, page_size: 50 });
}

export function PortalNotificationsPage() {
  const rent = useScopedDemoList<DemoInvoice>("rentInvoices", { page_size: 50 });
  const deals = useScopedDemoList<DemoPortalDeal>("portalDeals", { page_size: 50 });
  const calendar = useScopedDemoList<DemoCalendarEvent>("calendar", { page_size: 50 });

  const alerts = useMemo(() => {
    const items: { id: string; text: string; to: string }[] = [];
    for (const r of rent.data?.results ?? []) {
      if (r.status === "overdue") {
        items.push({
          id: `rent-${r.id}`,
          text: `Overdue rent ${r.number} · ${compactMoney(r.amount)}`,
          to: "/portal/lease/payments",
        });
      } else if (r.status === "issued") {
        items.push({
          id: `rent-due-${r.id}`,
          text: `Rent due ${r.number} · ${compactMoney(r.amount)}`,
          to: "/portal/lease/payments",
        });
      }
    }
    for (const d of deals.data?.results ?? []) {
      if (d.status === "offer") {
        items.push({ id: `deal-${d.id}`, text: `Offer update: ${d.title}`, to: "/portal/offers" });
      }
    }
    for (const e of calendar.data?.results ?? []) {
      items.push({ id: `cal-${e.id}`, text: `Upcoming: ${e.title}`, to: "/portal/schedule" });
    }
    return items.slice(0, 12);
  }, [rent.data?.results, deals.data?.results, calendar.data?.results]);

  return (
    <ModuleDashboard
      title="Notifications"
      description="Alerts on your own rent, deals, and calendar — after a completed contract."
      stats={[
        { label: "Alerts", value: alerts.length, icon: Bell, tone: alerts.length ? "warning" : "muted" },
      ]}
    >
      <Panel title="Your alerts">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts right now.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="py-3">
                <Link to={a.to} className="text-primary hover:underline">
                  {a.text}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalMessagesPage() {
  const messages = useScopedDemoList<DemoMessage>("messages", { page_size: 50 });
  const rows = messages.data?.results ?? [];

  return (
    <ModuleDashboard
      title="Messages"
      description="Your conversations with the agency. Other clients’ threads are never shown."
      stats={[
        { label: "Threads", value: rows.length, icon: MessageSquare, tone: "info", loading: messages.isLoading },
      ]}
    >
      <Panel title="Inbox" loading={messages.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No messages on this account yet. Staff will appear here after they write to you.
          </p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((m) => (
              <li key={m.id} className="space-y-1 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{m.subject}</span>
                  <StatusBadge value={humanize(m.channel)} tone="muted" />
                </div>
                <p className="text-muted-foreground">{m.body}</p>
                <p className="text-xs text-muted-foreground">
                  {m.contact} · {relativeTime(m.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalSearchesPage() {
  return (
    <ResourceListPage
      title="Saved Searches"
      description="Alerts when matching listings appear."
      resource="savedSearches"
      entity="property"
      icon={Target}
      columns={[
        { key: "name", header: "Search" },
        { key: "criteria", header: "Criteria" },
        { key: "matches", header: "Matches" },
        { key: "frequency", header: "Frequency", kind: "badge" },
      ]}
    />
  );
}

export function PortalMatchesPage() {
  const searches = useScopedDemoList<DemoSavedSearch>("savedSearches", { page_size: 50 });
  const favorites = useScopedDemoList<DemoFavorite>("favorites", { page_size: 50 });
  const searchRows = searches.data?.results ?? [];
  const matchRows = favorites.data?.results ?? [];
  const matchCount = searchRows.reduce((s, r) => s + Number(r.matches || 0), 0);

  return (
    <ModuleDashboard
      title="Match Properties"
      description="Listings that fit your saved-search criteria. Not a favorites alias."
      stats={[
        { label: "Saved searches", value: searchRows.length, icon: Target, tone: "info", loading: searches.isLoading },
        { label: "Reported matches", value: matchCount, icon: Building2, tone: "primary" },
        { label: "Suggested listings", value: matchRows.length, icon: Building2, tone: "success" },
      ]}
    >
      <Panel title="Search criteria" loading={searches.isLoading}>
        {searchRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Save a search to start receiving matches.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {searchRows.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="font-medium">{s.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{s.criteria}</span>
                </span>
                <span className="tabular-nums">{s.matches} matches</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Suggested from your criteria">
        {matchRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching listings on this account yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {matchRows.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  {f.title}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {f.city} · {f.beds} beds
                  </span>
                </span>
                <span className="tabular-nums">{compactMoney(f.price)}</span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="link" className="mt-2 h-auto p-0" asChild>
          <Link to="/portal/favorites">Open favorites</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalFavoritesPage() {
  return (
    <ResourceListPage
      title="Favorites"
      description="Properties you are watching."
      resource="favorites"
      entity="property"
      icon={Building2}
      statusDomain="listing"
      columns={[
        { key: "title", header: "Property" },
        { key: "city", header: "City" },
        { key: "beds", header: "Beds" },
        { key: "price", header: "Price", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "listing" },
      ]}
    />
  );
}

export function PortalDealsPage() {
  return (
    <ResourceListPage
      title="My Deals"
      description="Active offers and closed transactions on your completed contracts."
      resource="portalDeals"
      entity="deal"
      icon={Target}
      statusDomain="opportunity"
      columns={[
        { key: "title", header: "Deal" },
        { key: "property", header: "Property" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "opportunity" },
        { key: "updated_at", header: "Updated", kind: "datetime" },
      ]}
    />
  );
}

export function PortalOffersPage() {
  return (
    <ResourceListPage
      title="Offers"
      description="Offers you have submitted or received."
      resource="portalDeals"
      entity="deal"
      icon={FileText}
      fixedFilter={{ status: "offer" }}
      statusDomain="opportunity"
      columns={[
        { key: "title", header: "Offer" },
        { key: "property", header: "Property" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "opportunity" },
      ]}
    />
  );
}

export function PortalDocumentsPage() {
  const docs = useScopedDemoList<DemoDocument>("documents", { page_size: 50 });
  const mutate = useDemoMutate("documents");
  const rows = docs.data?.results ?? [];
  const pending = rows.filter((d) => d.status === "pending_signature");

  return (
    <ModuleDashboard
      title="Documents"
      description="Your shared files and contracts. Sign is demo-only."
      stats={[
        { label: "Documents", value: rows.length, icon: FileText, tone: "info", loading: docs.isLoading },
        { label: "Awaiting signature", value: pending.length, icon: FileText, tone: pending.length ? "warning" : "muted" },
      ]}
    >
      <Panel title="Your files" loading={docs.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents shared with this account.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  {d.title}
                  <span className="mt-0.5 block text-xs text-muted-foreground">{d.type}</span>
                </span>
                <span className="flex items-center gap-3">
                  <StatusBadge
                    value={humanize(d.status)}
                    tone={d.status === "signed" ? "success" : d.status === "pending_signature" ? "warning" : "muted"}
                  />
                  {d.status === "pending_signature" && (
                    <Button
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => {
                        mutate.patch(d.id, { status: "signed" });
                        toast.success(`${d.title} signed (demo)`);
                      }}
                    >
                      Sign
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalSchedulePage() {
  const [params] = useSearchParams();
  const type = params.get("type") ?? undefined;
  const calendar = useScopedDemoList<DemoCalendarEvent>("calendar", { type, page_size: 50 });
  const rows = calendar.data?.results ?? [];

  return (
    <ModuleDashboard
      title="My Schedule"
      description="Your viewings and meetings. Staff calendar create/edit stays with the agent."
      stats={[
        { label: "Upcoming", value: rows.length, icon: Calendar, tone: "info", loading: calendar.isLoading },
      ]}
    >
      <Panel title="Your calendar" loading={calendar.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled on this account.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  {e.title}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {humanize(e.type)} · {e.property}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{relativeTime(e.start)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalLeasePage() {
  const leases = useOwnLeases("tenant");
  const lease = leases.data?.results?.[0];

  return (
    <ModuleDashboard
      title="Active Lease"
      description="Your current tenancy after a signed lease."
      stats={[
        { label: "Reference", value: lease?.reference ?? "—", icon: KeyRound, tone: "info" },
        { label: "Rent", value: lease ? compactMoney(lease.rent) : "—", icon: CircleDollarSign, tone: "success" },
        { label: "Ends", value: lease?.end_date?.slice(0, 10) ?? "—", icon: Target, tone: "warning" },
        { label: "Status", value: lease ? humanize(lease.status) : "—", icon: FileText, tone: "primary" },
      ]}
    >
      <Panel title="Property">
        <p className="text-sm">
          {lease ? `${lease.property} · Unit ${lease.unit}` : "No active lease on file."}
        </p>
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalLeasePaymentsPage() {
  const invoices = useScopedDemoList<DemoInvoice>("rentInvoices", { page_size: 50 });
  const payments = useScopedDemoList<DemoPayment>("payments", { page_size: 50 });
  const invMutate = useDemoMutate("rentInvoices");
  const payMutate = useDemoMutate("payments");
  const { me } = useAuth();
  const rows = invoices.data?.results ?? [];
  const paid = payments.data?.results ?? [];
  const open = rows.filter((r) => r.status === "issued" || r.status === "overdue" || r.status === "partially_paid");

  function pay(row: DemoInvoice) {
    invMutate.patch(row.id, { status: "paid" });
    const ref = `PAY-${Date.now().toString().slice(-6)}`;
    payMutate.upsert({
      id: `pay-${Date.now()}`,
      reference: ref,
      payer: row.contact,
      amount: row.amount,
      method: "Card",
      date: new Date().toISOString().slice(0, 10),
      status: "posted",
      ownerEmail: me?.email,
    });
    toast.success(`Receipt ${ref} (demo)`);
  }

  return (
    <ModuleDashboard
      title="Rent Payments"
      description="Your rent invoices only. Paying records a demo receipt."
      stats={[
        { label: "Open", value: open.length, icon: CreditCard, tone: open.length ? "warning" : "muted" },
        { label: "Paid receipts", value: paid.length, icon: Receipt, tone: "success" },
      ]}
    >
      <Panel title="Invoices" loading={invoices.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rent invoices on this account.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  {r.number} · {r.contact}
                  <span className="mt-0.5 block text-xs text-muted-foreground">Due {r.due_date}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{compactMoney(r.amount)}</span>
                  <StatusBadge
                    value={humanize(r.status)}
                    tone={r.status === "overdue" ? "destructive" : r.status === "paid" ? "success" : "warning"}
                  />
                  {(r.status === "issued" || r.status === "overdue" || r.status === "partially_paid") && (
                    <Button size="sm" className="min-h-[44px]" onClick={() => pay(r)}>
                      Pay
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalLeaseMaintenancePage() {
  const orders = useScopedDemoList<DemoWorkOrder>("workOrders", { page_size: 50 });
  const leases = useOwnLeases("tenant");
  const mutate = useDemoMutate("workOrders");
  const { me } = useAuth();
  const rows = orders.data?.results ?? [];
  const lease = leases.data?.results?.[0];
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<DemoWorkOrder["priority"]>("medium");

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Describe the issue first.");
      return;
    }
    mutate.upsert({
      id: `wo-${Date.now()}`,
      title: trimmed,
      property: lease?.property ?? "My unit",
      priority,
      status: "new",
      vendor: "—",
      cost: 0,
      requested_at: new Date().toISOString(),
      ownerEmail: me?.email,
    });
    setTitle("");
    toast.success("Request submitted — your property manager will see it in the queue.");
  }

  return (
    <ModuleDashboard
      title="Maintenance Requests"
      description="Submit and track work orders for your unit. Assigning vendors is staff-only."
      stats={[
        { label: "Open", value: rows.filter((r) => !["completed", "cancelled"].includes(r.status)).length, icon: Wrench, tone: "warning" },
        { label: "All requests", value: rows.length, icon: Wrench, tone: "info", loading: orders.isLoading },
      ]}
    >
      <Panel title="Submit a request">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm">
            Issue
            <Input
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC not cooling"
            />
          </label>
          <label className="text-sm">
            Priority
            <select
              className="mt-1 flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as DemoWorkOrder["priority"])}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </select>
          </label>
          <Button className="min-h-[44px]" onClick={submit}>
            Submit
          </Button>
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => toast.message("Photo upload is demo-only for this round.")}
          >
            Add photos
          </Button>
        </div>
      </Panel>
      <Panel title="Your work orders" loading={orders.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No maintenance requests yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  {r.title}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {r.property} · {humanize(r.priority)}
                  </span>
                </span>
                <StatusBadge
                  value={humanize(r.status)}
                  tone={r.status === "completed" ? "success" : r.status === "new" ? "warning" : "info"}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalLeaseDocumentsPage() {
  const docs = useScopedDemoList<DemoDocument>("documents", { page_size: 50 });
  const rows = (docs.data?.results ?? []).filter((d) =>
    /lease|contract/i.test(`${d.type} ${d.title}`),
  );

  return (
    <ModuleDashboard
      title="Lease Documents"
      description="Lease and contract files shared with you."
      stats={[{ label: "Files", value: rows.length, icon: FileText, tone: "info", loading: docs.isLoading }]}
    >
      <Panel title="Lease files" loading={docs.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lease documents on this account.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <span>{d.title}</span>
                <StatusBadge value={humanize(d.status)} tone={d.status === "signed" ? "success" : "warning"} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalLandlordPropertiesPage() {
  const leases = useOwnLeases("landlord");
  const units = useMemo(() => {
    const rows = leases.data?.results ?? [];
    const seen = new Set<string>();
    return rows.filter((r) => {
      const key = `${r.property}::${r.unit}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [leases.data?.results]);
  const occupied = units.filter((u) => u.status === "active" || u.status === "expiring" || u.status === "renewed");

  return (
    <ModuleDashboard
      title="Listed Properties"
      description="Units you let through the agency — from your landlord leases, not staff inventory."
      stats={[
        { label: "Units", value: units.length, icon: Building2, tone: "info", loading: leases.isLoading },
        { label: "Occupied", value: occupied.length, icon: KeyRound, tone: "success" },
      ]}
    >
      <Panel title="Your units" loading={leases.isLoading}>
        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No landlord properties on this account.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {units.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  {u.property} · {u.unit}
                  <span className="mt-0.5 block text-xs text-muted-foreground">Tenant: {u.tenant}</span>
                </span>
                <StatusBadge value={humanize(u.status)} tone={u.status === "active" ? "success" : "warning"} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalLandlordPerformancePage() {
  const leases = useOwnLeases("landlord");
  const statements = useScopedDemoList<DemoOwnerStatement>("ownerStatements", { page_size: 50 });
  const units = leases.data?.results ?? [];
  const stmts = statements.data?.results ?? [];
  const occupied = units.filter((u) => ["active", "expiring", "renewed"].includes(u.status));
  const occupancy = units.length ? Math.round((occupied.length / units.length) * 100) : 0;
  const income = stmts.reduce((s, r) => s + Number(r.net || 0), 0);
  const rent = occupied.reduce((s, r) => s + Number(r.rent || 0), 0);

  return (
    <ModuleDashboard
      title="Performance Reports"
      description="Occupancy and income from your own units. Not the company portfolio report."
      stats={[
        { label: "Occupancy", value: `${occupancy}%`, icon: Building2, tone: "success" },
        { label: "Contracted rent", value: compactMoney(rent), icon: CircleDollarSign, tone: "primary" },
        { label: "Statement net", value: compactMoney(income), icon: Receipt, tone: "info" },
      ]}
    >
      <Panel title="By unit" loading={leases.isLoading}>
        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No landlord leases on this account.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {units.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  {u.property} · {u.unit}
                </span>
                <span className="tabular-nums">{compactMoney(u.rent)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function PortalLandlordStatementsPage() {
  return (
    <ResourceListPage
      title="Rent Statements"
      description="Owner remittance statements for your units."
      resource="ownerStatements"
      entity="finance"
      icon={Receipt}
      statusDomain="finance"
      columns={[
        { key: "property", header: "Property" },
        { key: "period", header: "Period" },
        { key: "rent_collected", header: "Collected", kind: "money" },
        { key: "fees", header: "Fees", kind: "money" },
        { key: "net", header: "Net", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
      ]}
    />
  );
}

export function PortalLandlordLeasesPage() {
  return (
    <ResourceListPage
      title="Lease Management"
      description="Leases on properties you own. View-only — renew and terminate stay with the property manager."
      resource="leases"
      entity="lease"
      icon={KeyRound}
      statusDomain="lease"
      fixedFilter={{ leaseRole: "landlord" }}
      columns={[
        { key: "reference", header: "Ref" },
        { key: "property", header: "Property" },
        { key: "unit", header: "Unit" },
        { key: "tenant", header: "Tenant" },
        { key: "rent", header: "Rent", kind: "money" },
        { key: "end_date", header: "End", kind: "date" },
        { key: "status", header: "Status", kind: "status", domain: "lease" },
      ]}
    />
  );
}
