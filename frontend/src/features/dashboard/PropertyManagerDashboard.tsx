import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  FileText,
  KeyRound,
  Percent,
  Plus,
  Receipt,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Can } from "../../components/RequireRole";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useScopedDemoList, type DemoInvoice, type DemoLease, type DemoWorkOrder } from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { useList } from "../../lib/hooks";

const OCCUPIED = new Set(["active", "expiring", "renewed"]);

const QUICK_ACTIONS = [
  { to: "/tenants?new=1", label: "Add tenant", icon: Users, tone: "bg-info-subtle text-info" },
  { to: "/maintenance?new=1", label: "New work order", icon: Wrench, tone: "bg-warning-subtle text-warning" },
  { to: "/rent/late", label: "Late payments", icon: AlertTriangle, tone: "bg-destructive-subtle text-destructive" },
  { to: "/leases?status=expiring", label: "Expiring leases", icon: FileText, tone: "bg-primary-subtle text-primary" },
  { to: "/inspections", label: "Inspections", icon: ClipboardCheck, tone: "bg-success-subtle text-success" },
  { to: "/reports/financial", label: "Owner statement", icon: Receipt, tone: "bg-muted text-muted-foreground" },
] as const;

export function PropertyManagerDashboard() {
  const props = useList<{ id: string; node_type: string }>("properties", { page_size: 200 });
  const leases = useScopedDemoList<DemoLease>("leases", { page_size: 100 });
  const workOrders = useScopedDemoList<DemoWorkOrder>("workOrders", { page_size: 100 });
  const rentInvoices = useScopedDemoList<DemoInvoice>("rentInvoices", { page_size: 100 });

  const units = (props.data?.results ?? []).filter((p) => p.node_type === "property");
  const leaseRows = leases.data?.results ?? [];
  const occupied = leaseRows.filter((l) => OCCUPIED.has(l.status)).length;
  const expiring = leaseRows.filter((l) => l.status === "expiring").length;
  const managed = Math.max(units.length, occupied);
  const occupancy = managed ? Math.round((occupied / managed) * 100) : 0;
  const openWo = (workOrders.data?.results ?? []).filter(
    (w) => !["completed", "cancelled"].includes(w.status),
  ).length;
  const invoiceRows = rentInvoices.data?.results ?? [];
  const overdue = invoiceRows.filter((i) => i.status === "overdue");
  const paidAmt = invoiceRows.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
  const dueAmt = invoiceRows.reduce((s, i) => s + Number(i.amount || 0), 0);
  const collection = dueAmt ? Math.round((paidAmt / dueAmt) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Properties managed" value={managed} icon={Building2} tone="info" loading={props.isLoading} />
        <StatCard
          label="Occupancy"
          value={`${occupancy}%`}
          icon={KeyRound}
          tone="primary"
          loading={leases.isLoading || props.isLoading}
        />
        <StatCard
          label="Collection"
          value={`${collection}%`}
          icon={Percent}
          tone="success"
          loading={rentInvoices.isLoading}
        />
        <StatCard
          label="Late payments"
          value={overdue.length}
          icon={AlertTriangle}
          tone={overdue.length ? "destructive" : "muted"}
        />
        <StatCard label="Open work orders" value={openWo} icon={Wrench} tone={openWo ? "warning" : "muted"} />
        <StatCard
          label="Expiring soon"
          value={expiring}
          icon={FileText}
          tone={expiring ? "warning" : "muted"}
          loading={leases.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Can roles={["property_manager"]}>
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
            <CardTitle>Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold tabular">{occupancy}%</p>
            <p className="text-muted-foreground">
              {occupied} occupied of {managed} managed units.
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/reports/occupancy">Occupancy report</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Leases & rent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Occupied <b>{occupied}</b> · Expiring <b>{expiring}</b>
            </p>
            <p className="text-muted-foreground">
              Late {compactMoney(overdue.reduce((s, i) => s + Number(i.amount || 0), 0))}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/leases?status=expiring">Expiring leases</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/rent/late">Late payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Open work orders <b>{openWo}</b>
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/maintenance">Work orders</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Renewals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">Handle expiring leases, rent increases, and negotiations.</p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/leases?status=expiring">
                <Plus className="size-4" /> Review renewals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
