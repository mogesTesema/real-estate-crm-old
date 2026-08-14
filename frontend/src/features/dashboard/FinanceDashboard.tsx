import {
  AlertTriangle,
  CircleDollarSign,
  FileText,
  Plug,
  Receipt,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Can } from "../../components/RequireRole";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  useScopedDemoList,
  type DemoCommission,
  type DemoInvoice,
  type DemoTransaction,
} from "../../lib/demo";
import { compactMoney } from "../../lib/format";

const QUICK_ACTIONS = [
  { to: "/finance/commissions?status=pending_approval", label: "Approve commissions", icon: Receipt, tone: "bg-warning-subtle text-warning" },
  { to: "/finance/pending", label: "Open pending invoices", icon: FileText, tone: "bg-info-subtle text-info" },
  { to: "/finance/vat", label: "VAT report", icon: CircleDollarSign, tone: "bg-primary-subtle text-primary" },
  { to: "/finance/reconciliation", label: "Reconcile", icon: Plug, tone: "bg-muted text-muted-foreground" },
  { to: "/finance/integrations/export", label: "Export accounting", icon: FileText, tone: "bg-success-subtle text-success" },
  { to: "/finance/escrow", label: "Trust / escrow", icon: Shield, tone: "bg-destructive-subtle text-destructive" },
] as const;

export function FinanceDashboard() {
  const commissions = useScopedDemoList<DemoCommission>("commissions", { page_size: 100 });
  const invoices = useScopedDemoList<DemoInvoice>("invoices", { page_size: 100 });
  const transactions = useScopedDemoList<DemoTransaction>("transactions", { page_size: 100 });
  const comRows = commissions.data?.results ?? [];
  const invRows = invoices.data?.results ?? [];
  const txRows = transactions.data?.results ?? [];

  const pending = comRows.filter((c) => c.status === "pending_approval");
  const paidCom = comRows.filter((c) => c.status === "paid");
  const overdue = invRows.filter((i) => i.status === "overdue");
  const pendingPayments = invRows.filter((i) => ["issued", "partially_paid"].includes(i.status));
  const revenue = invRows.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
  const pendingNet = pending.reduce((s, c) => s + Number(c.net || 0), 0);
  const paidNet = paidCom.reduce((s, c) => s + Number(c.net || 0), 0);
  const trustRows = txRows.filter((t) => t.account === "Trust");

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue (paid)" value={compactMoney(revenue)} icon={CircleDollarSign} tone="success" loading={invoices.isLoading} />
        <StatCard
          label="Pending commissions"
          value={pending.length}
          icon={Receipt}
          tone="warning"
          loading={commissions.isLoading}
        />
        <StatCard label="Pending payments" value={pendingPayments.length} icon={FileText} tone="primary" />
        <StatCard
          label="Overdue invoices"
          value={overdue.length}
          icon={AlertTriangle}
          tone={overdue.length ? "destructive" : "muted"}
        />
        <StatCard label="Commissions paid" value={compactMoney(paidNet)} icon={CircleDollarSign} tone="success" />
        <StatCard
          label="Trust rows"
          value={trustRows.length}
          icon={Shield}
          tone="info"
          loading={transactions.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Can roles={["finance"]}>
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
            <CardTitle>Commissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Pending net <b>{compactMoney(pendingNet)}</b>
            </p>
            {pending.slice(0, 4).map((c) => (
              <div key={c.id} className="flex justify-between">
                <span>{c.agent}</span>
                <span className="tabular">{compactMoney(c.net)}</span>
              </div>
            ))}
            <Can roles={["finance", "owner", "super_admin"]}>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/finance/commissions?status=pending_approval">Approve pending</Link>
              </Button>
            </Can>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pending payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Issued / partial invoices awaiting funds: <b>{pendingPayments.length}</b>
            </p>
            <p className="text-muted-foreground">
              Overdue needing chase: <b>{overdue.length}</b>
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/finance/pending">Open pending</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trust / cash</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Trust rows <b>{trustRows.length}</b> · All transactions{" "}
              <b>{transactions.data?.count ?? txRows.length}</b>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/finance/escrow">Escrow</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/finance/transactions">Transactions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>VAT & payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">Paid commission nets {compactMoney(paidNet)}. VAT is on agency invoices, not rent.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/finance/vat">VAT reports</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/finance/commissions?status=paid">Paid commissions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
