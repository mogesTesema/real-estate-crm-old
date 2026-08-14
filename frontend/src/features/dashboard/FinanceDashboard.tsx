import { CircleDollarSign, FileText, Receipt, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { Can } from "../../components/RequireRole";
import { StatCard } from "../../components/StatCard";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useScopedDemoList } from "../../lib/demo";
import { compactMoney } from "../../lib/format";

export function FinanceDashboard() {
  const commissions = useScopedDemoList("commissions", { page_size: 100 });
  const invoices = useScopedDemoList("invoices", { page_size: 100 });
  const transactions = useScopedDemoList("transactions", { page_size: 100 });
  const comRows = commissions.data?.results ?? [];
  const invRows = invoices.data?.results ?? [];
  const pending = comRows.filter((c) => (c as unknown as { status: string }).status === "pending_approval");
  const overdue = invRows.filter((i) => (i as unknown as { status: string }).status === "overdue");
  const pendingPayments = invRows.filter((i) =>
    ["issued", "partially_paid"].includes((i as unknown as { status: string }).status),
  );
  const revenue = invRows
    .filter((i) => (i as unknown as { status: string }).status === "paid")
    .reduce((s, i) => s + Number((i as unknown as { amount: number }).amount || 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (paid)" value={compactMoney(revenue)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Pending commissions" value={pending.length} icon={Receipt} tone="warning" />
        <StatCard label="Overdue invoices" value={overdue.length} icon={FileText} tone={overdue.length ? "destructive" : "muted"} />
        <StatCard label="Pending payments" value={pendingPayments.length} icon={TrendingUp} tone="primary" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pending.slice(0, 4).map((c) => {
              const row = c as unknown as { id: string; agent: string; net: number };
              return (
                <div key={row.id} className="flex justify-between">
                  <span>{row.agent}</span>
                  <span className="tabular">{compactMoney(row.net)}</span>
                </div>
              );
            })}
            <Can roles={["finance", "owner", "super_admin"]}>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/finance/commissions?status=pending_approval">Approve pending</Link>
              </Button>
            </Can>
          </CardContent>
        </Card>
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
              <Link to="/finance/invoices?status=issued">Open invoices</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash movement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Transactions on file: <b>{transactions.data?.count ?? 0}</b>
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/finance/transactions">All transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
