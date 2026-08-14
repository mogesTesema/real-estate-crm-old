import {
  AlertTriangle,
  CircleDollarSign,
  CreditCard,
  FileText,
  Receipt,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import {
  useScopedDemoList,
  type DemoCommission,
  type DemoInvoice,
  type DemoTransaction,
} from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { humanize } from "../../lib/status";

const PENDING_INV = new Set(["issued", "partially_paid", "overdue"]);
const MILESTONE_RE = /installment|milestone/i;

function netOf(rows: DemoCommission[], status?: string) {
  return rows
    .filter((r) => (status ? r.status === status : true))
    .reduce((s, r) => s + Number(r.net || 0), 0);
}

export function PendingPaymentsPage() {
  const invoices = useScopedDemoList<DemoInvoice>("invoices", { page_size: 100 });
  const rows = (invoices.data?.results ?? []).filter((r) => PENDING_INV.has(r.status));
  const overdue = rows.filter((r) => r.status === "overdue");
  const due = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <ModuleDashboard
      title="Pending Payments"
      description="Issued, partial, and overdue agency invoices. Not property-manager rent arrears."
      stats={[
        { label: "Open invoices", value: rows.length, icon: FileText, tone: "info", loading: invoices.isLoading },
        { label: "Amount due", value: compactMoney(due), icon: CircleDollarSign, tone: "primary" },
        { label: "Overdue", value: overdue.length, icon: AlertTriangle, tone: overdue.length ? "destructive" : "muted" },
      ]}
    >
      <Panel title="Chase queue" loading={invoices.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending agency invoices.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate">
                  {r.number} · {r.contact}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{compactMoney(r.amount)}</span>
                  <StatusBadge value={humanize(r.status)} tone={r.status === "overdue" ? "destructive" : "warning"} />
                  <Can roles={["finance", "owner", "super_admin"]}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => toast.success(`Chase sent to ${r.contact} (demo)`)}
                    >
                      Chase
                    </Button>
                  </Can>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="link" className="mt-2 h-auto p-0" asChild>
          <Link to="/finance/invoices">All invoices</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function CommissionSummaryPage() {
  const list = useScopedDemoList<DemoCommission>("commissions", { page_size: 100 });
  const rows = list.data?.results ?? [];
  const pending = rows.filter((r) => r.status === "pending_approval");
  const approved = rows.filter((r) => r.status === "approved");
  const paid = rows.filter((r) => r.status === "paid");

  return (
    <ModuleDashboard
      title="Commission Summary"
      description="Agency-wide commission status. Not an agent personal report."
      stats={[
        { label: "Pending net", value: compactMoney(netOf(pending)), icon: AlertTriangle, tone: "warning", loading: list.isLoading },
        { label: "Approved net", value: compactMoney(netOf(approved)), icon: Receipt, tone: "info" },
        { label: "Paid net", value: compactMoney(netOf(paid)), icon: CircleDollarSign, tone: "success" },
        { label: "Lines", value: rows.length, icon: FileText, tone: "muted" },
      ]}
    >
      <Panel title="By agent" loading={list.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">
                {r.agent} · {r.deal}
              </span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums">{compactMoney(r.net)}</span>
                <StatusBadge value={humanize(r.status)} tone={r.status === "paid" ? "success" : "warning"} />
              </span>
            </li>
          ))}
        </ul>
        <Button variant="link" className="mt-2 h-auto p-0" asChild>
          <Link to="/finance/commissions">Commission ledger</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function PnLPage() {
  const invoices = useScopedDemoList<DemoInvoice>("invoices", { page_size: 100 });
  const commissions = useScopedDemoList<DemoCommission>("commissions", { page_size: 100 });
  const inv = invoices.data?.results ?? [];
  const com = commissions.data?.results ?? [];
  const revenue = inv.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount || 0), 0);
  const cogs = netOf(com, "paid");
  const pendingCost = netOf(com, "pending_approval") + netOf(com, "approved");
  const net = revenue - cogs;

  return (
    <ModuleDashboard
      title="Profit / Loss"
      description="Demo-store snapshot: paid agency invoices minus paid commission nets. Not a full ledger."
      stats={[
        { label: "Revenue (paid invoices)", value: compactMoney(revenue), icon: CircleDollarSign, tone: "success", loading: invoices.isLoading },
        { label: "Commission paid", value: compactMoney(cogs), icon: Receipt, tone: "warning", loading: commissions.isLoading },
        { label: "Commission still open", value: compactMoney(pendingCost), icon: Target, tone: "info" },
        { label: "Net (demo)", value: compactMoney(net), icon: TrendingUp, tone: "primary" },
      ]}
    />
  );
}

export function MilestonesPage() {
  const tx = useScopedDemoList<DemoTransaction>("transactions", { page_size: 100 });
  const rows = (tx.data?.results ?? []).filter((r) => MILESTONE_RE.test(r.type));
  const pending = rows.filter((r) => r.status === "pending");
  const volume = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <ModuleDashboard
      title="Payment Milestones"
      description="Sale installment and off-plan milestone rows. Not the full transaction list."
      stats={[
        { label: "Milestones", value: rows.length, icon: Target, tone: "info", loading: tx.isLoading },
        { label: "Pending", value: pending.length, icon: AlertTriangle, tone: pending.length ? "warning" : "muted" },
        { label: "Volume", value: compactMoney(volume), icon: CircleDollarSign, tone: "primary" },
      ]}
    >
      <Panel title="Schedule" loading={tx.isLoading}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No installment rows in the demo store.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate">
                  {r.reference} · {r.type}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{compactMoney(r.amount)}</span>
                  <StatusBadge value={humanize(r.status)} tone={r.status === "pending" ? "warning" : "success"} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ModuleDashboard>
  );
}

export function TaxSettingsPage() {
  return (
    <ModuleDashboard
      title="Tax Settings"
      description="VAT applied on commission invoices (SRS 3.6.7). Company jurisdiction is Super Admin / Owner org config."
      stats={[
        { label: "Configured rate", value: "5%", icon: Receipt, tone: "primary" },
        { label: "Jurisdiction", value: "AE (demo)", icon: FileText, tone: "info" },
        { label: "Applies to", value: "Commission invoices", icon: Target, tone: "muted" },
      ]}
    >
      <Panel title="How tax is applied">
        <p className="text-sm text-muted-foreground">
          Finance applies the company VAT rate on brokerage commission invoices. This screen does not edit
          company legal details or localization — those stay with Super Admin / Owner.
        </p>
        <Button variant="link" className="mt-2 h-auto p-0" asChild>
          <Link to="/finance/vat">VAT reports</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function CommissionRulesPage() {
  return (
    <ModuleDashboard
      title="Commission Rules"
      description="Finance applies tax and pays approved lines. Split plans (flat, tiered, co-broke) are owned by the Broker/Owner."
      stats={[
        { label: "Finance role", value: "Approve / pay", icon: Receipt, tone: "success" },
        { label: "Owner role", value: "Plan editor", icon: FileText, tone: "info" },
        { label: "Manager role", value: "Review only", icon: Target, tone: "warning" },
      ]}
    >
      <Panel title="Who edits what">
        <p className="text-sm text-muted-foreground">
          Commission plans live under the Owner workspace. Finance does not open that editor. Use the
          commission ledger to approve and pay calculated lines.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/finance/commissions?status=pending_approval">Pending approval</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/finance/reports/commission">Agency summary</Link>
          </Button>
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function EscrowPage() {
  const tx = useScopedDemoList<DemoTransaction>("transactions", { page_size: 100 });
  const rows = (tx.data?.results ?? []).filter((r) => r.account === "Trust");
  const completed = rows.filter((r) => r.status === "completed");
  const pending = rows.filter((r) => r.status === "pending");
  const held = completed.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <ModuleDashboard
      title="Trust / escrow"
      description="Security deposits and trust-account movements (SRS 3.6.8). Not operating AR."
      stats={[
        { label: "Trust rows", value: rows.length, icon: Shield, tone: "info", loading: tx.isLoading },
        { label: "Completed volume", value: compactMoney(held), icon: CircleDollarSign, tone: "primary" },
        { label: "Pending remittance", value: pending.length, icon: AlertTriangle, tone: pending.length ? "warning" : "muted" },
      ]}
    >
      <Panel title="Trust ledger" loading={tx.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">
                {r.reference} · {r.type}
              </span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums">{compactMoney(r.amount)}</span>
                <StatusBadge value={humanize(r.status)} tone={r.status === "completed" ? "success" : "warning"} />
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function AuditRecordsPage() {
  const invoices = useScopedDemoList<DemoInvoice>("invoices", { page_size: 100 });
  const tx = useScopedDemoList<DemoTransaction>("transactions", { page_size: 100 });
  const inv = invoices.data?.results ?? [];
  const rows = tx.data?.results ?? [];

  return (
    <ModuleDashboard
      title="Audit records"
      description="Invoice and transaction history for audit preparation. Export is demo-only."
      stats={[
        { label: "Invoices", value: inv.length, icon: FileText, tone: "info", loading: invoices.isLoading },
        { label: "Transactions", value: rows.length, icon: CreditCard, tone: "primary", loading: tx.isLoading },
      ]}
      actions={
        <Can roles={["finance", "owner", "super_admin"]}>
          <Button
            className="min-h-[44px]"
            onClick={() => toast.success("Audit pack queued (demo) — CSV would download in production.")}
          >
            Export audit pack
          </Button>
        </Can>
      }
    >
      <Panel title="Recent movements" loading={tx.isLoading}>
        <ul className="divide-y divide-border text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate">
                {r.date} · {r.reference} · {r.account}
              </span>
              <span className="tabular-nums">{compactMoney(r.amount)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}
