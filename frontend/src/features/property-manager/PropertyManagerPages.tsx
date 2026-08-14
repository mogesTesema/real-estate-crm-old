import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  CircleDollarSign,
  Droplets,
  KeyRound,
  Percent,
  Receipt,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { useScopedDemoList, type DemoInvoice, type DemoLease, type DemoPayment } from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { humanize } from "../../lib/status";

const OCCUPIED = new Set(["active", "expiring", "renewed"]);

export function OccupancyReportsPage() {
  const properties = useList<{ id: string; node_type: string }>("properties", { page_size: 200 });
  const leases = useScopedDemoList<DemoLease>("leases", { page_size: 100 });
  const units = (properties.data?.results ?? []).filter((p) => p.node_type === "property");
  const leaseRows = leases.data?.results ?? [];
  const occupied = leaseRows.filter((l) => OCCUPIED.has(l.status)).length;
  const expiring = leaseRows.filter((l) => l.status === "expiring").length;
  const managed = Math.max(units.length, occupied);
  const vacant = Math.max(managed - occupied, 0);
  const occupancy = managed ? Math.round((occupied / managed) * 100) : 0;

  return (
    <ModuleDashboard
      title="Occupancy Rate"
      description="Occupied units over managed units. Terminated leases are not in the denominator."
      stats={[
        { label: "Occupancy", value: `${occupancy}%`, icon: Percent, tone: "primary", loading: leases.isLoading },
        { label: "Occupied", value: occupied, icon: KeyRound, tone: "success" },
        { label: "Vacant", value: vacant, icon: Building2, tone: vacant ? "warning" : "muted" },
        { label: "Expiring soon", value: expiring, icon: AlertTriangle, tone: expiring ? "warning" : "muted" },
      ]}
    >
      <Panel title="Lease mix" loading={leases.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {leaseRows.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">
                {l.property} · {l.unit} · {l.tenant}
              </span>
              <StatusBadge value={humanize(l.status)} tone={OCCUPIED.has(l.status) ? "success" : "muted"} />
            </li>
          ))}
        </ul>
        <Button variant="link" className="mt-2 h-auto p-0" asChild>
          <Link to="/leases?status=expiring">Expiring leases</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function LandlordFinancialPage() {
  const invoices = useScopedDemoList<DemoInvoice>("rentInvoices", { page_size: 100 });
  const payments = useScopedDemoList<DemoPayment>("payments", { page_size: 100 });
  const rows = invoices.data?.results ?? [];
  const paid = rows.filter((r) => r.status === "paid");
  const overdue = rows.filter((r) => r.status === "overdue");
  const collected = paid.reduce((s, r) => s + Number(r.amount || 0), 0);
  const arrears = overdue.reduce((s, r) => s + Number(r.amount || 0), 0);
  const posted = (payments.data?.results ?? []).reduce((s, r) => s + Number(r.amount || 0), 0);
  const fee = Math.round(collected * 0.08);

  return (
    <ModuleDashboard
      title="Financial Reports"
      description="Landlord rent statements: collected, arrears, and a management-fee teaser. Not VAT or agent commission."
      stats={[
        { label: "Rent collected", value: compactMoney(collected || posted), icon: CircleDollarSign, tone: "success", loading: invoices.isLoading },
        { label: "Arrears", value: compactMoney(arrears), icon: AlertTriangle, tone: arrears ? "destructive" : "muted" },
        { label: "Mgmt fee (8%)", value: compactMoney(fee), icon: Receipt, tone: "primary" },
        { label: "Invoices", value: rows.length, icon: Receipt, tone: "info" },
      ]}
    >
      <Panel title="Owner statement teaser" loading={invoices.isLoading}>
        <p className="text-sm text-muted-foreground">
          Net remittance {compactMoney(Math.max((collected || posted) - fee, 0))} after a demo 8% management fee.
          Round 2 persists statements per landlord (SRS 3.5.6).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/rent/reports">Rent reports</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/rent/late">Late payments</Link>
          </Button>
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function InspectionsPage() {
  const leases = useScopedDemoList<DemoLease>("leases", { page_size: 100 });
  const rows = leases.data?.results ?? [];

  return (
    <ModuleDashboard
      title="Move-in / move-out"
      description="Schedule inspections and capture condition reports. Photos persist in Round 2."
      stats={[
        { label: "Leases", value: rows.length, icon: KeyRound, tone: "info", loading: leases.isLoading },
        { label: "Move-in due", value: rows.filter((l) => l.status === "draft").length, icon: ClipboardCheck, tone: "warning" },
        { label: "Move-out due", value: rows.filter((l) => l.status === "expiring" || l.status === "terminated").length, icon: ClipboardCheck, tone: "destructive" },
      ]}
    >
      <Panel title="Inspection queue" loading={leases.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((l) => {
            const kind = l.status === "draft" ? "Move-in" : l.status === "terminated" || l.status === "expiring" ? "Move-out" : "Condition";
            return (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {kind} · {l.property} {l.unit}
                  </p>
                  <p className="text-muted-foreground">
                    {l.tenant} · {l.start_date} → {l.end_date}
                  </p>
                </div>
                <Can roles={["property_manager", "owner", "manager", "super_admin"]}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => toast.success(`${kind} started (demo)`)}
                    >
                      Start
                    </Button>
                    <Button
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => toast.success("Condition report saved (demo)")}
                    >
                      Complete
                    </Button>
                  </div>
                </Can>
              </li>
            );
          })}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

const METERS = [
  { id: "m-1", property: "Marina Tower", unit: "1204", utility: "Electricity", reading: "12 480 kWh", billback: 320 },
  { id: "m-2", property: "Marina Tower", unit: "1204", utility: "Water", reading: "86 m³", billback: 95 },
  { id: "m-3", property: "Riverside Villa", unit: "Whole", utility: "Electricity", reading: "4 210 kWh", billback: 510 },
  { id: "m-4", property: "Uptown Residences", unit: "802", utility: "District cooling", reading: "—", billback: 0 },
];

export function UtilitiesPage() {
  const total = METERS.reduce((s, m) => s + m.billback, 0);
  return (
    <ModuleDashboard
      title="Meters / billback"
      description="Track utility meters and billbacks to tenants (SRS 3.5.4). Demo list only."
      stats={[
        { label: "Meters", value: METERS.length, icon: Droplets, tone: "info" },
        { label: "Billback due", value: compactMoney(total), icon: CircleDollarSign, tone: "primary" },
        { label: "Open readings", value: METERS.filter((m) => m.reading === "—").length, icon: Wrench, tone: "warning" },
      ]}
    >
      <Panel title="Meter register">
        <ul className="divide-y divide-border text-sm">
          {METERS.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">
                  {m.utility} · {m.property} {m.unit}
                </p>
                <p className="text-muted-foreground">Last reading {m.reading}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums">{compactMoney(m.billback)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => toast.success("Meter reading saved (demo)")}
                >
                  Record
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}
