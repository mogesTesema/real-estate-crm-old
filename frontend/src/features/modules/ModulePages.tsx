import {
  BarChart3,
  Building2,
  CircleDollarSign,
  FileText,
  KeyRound,
  Plug,
  Receipt,
  Shield,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { ResourceListPage } from "../../components/ResourceListPage";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { useDemoMutate, useScopedDemoList } from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { MarketingRoiPage } from "../marketing/MarketingPages";

/* ---------- Agent / shared ---------- */

export function DocumentsPage() {
  return (
    <ResourceListPage
      title="Documents"
      description="Contracts, IDs, templates, and shared files."
      resource="documents"
      entity="deal"
      icon={FileText}
      statusDomain="finance"
      columns={[
        { key: "title", header: "Title" },
        { key: "type", header: "Type", kind: "badge" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
        { key: "updated_at", header: "Updated", kind: "datetime" },
      ]}
    />
  );
}

export function MyPerformanceReportPage() {
  const commissions = useScopedDemoList("commissions", { page_size: 50 });
  const rows = commissions.data?.results ?? [];
  const net = rows.reduce((s, r) => s + Number((r as unknown as { net: number }).net || 0), 0);
  return (
    <ModuleDashboard
      title="My Performance Report"
      description="Personal KPIs and commission projection."
      stats={[
        { label: "Commission YTD", value: compactMoney(net), icon: Receipt, tone: "success" },
        { label: "Splits tracked", value: rows.length, icon: BarChart3, tone: "info" },
        { label: "Pending approval", value: rows.filter((r) => (r as unknown as { status: string }).status === "pending_approval").length, icon: Target, tone: "warning" },
        { label: "Paid", value: rows.filter((r) => (r as unknown as { status: string }).status === "paid").length, icon: CircleDollarSign, tone: "primary" },
      ]}
    />
  );
}

export function MyCommissionReportPage() {
  return (
    <ResourceListPage
      title="Commission Report"
      description="Your commission lines and payout status."
      resource="commissions"
      entity="finance"
      icon={Receipt}
      statusDomain="finance"
      columns={[
        { key: "agent", header: "Agent" },
        { key: "deal", header: "Deal" },
        { key: "gross", header: "Gross", kind: "money" },
        { key: "net", header: "Net", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
        { key: "period", header: "Period" },
      ]}
    />
  );
}

/* ---------- Team (owner/manager) ---------- */

export function TeamAgentsPage() {
  return (
    <ResourceListPage
      title="Agents"
      description="Register and monitor sales agents."
      resource="agents"
      entity="lead"
      icon={Users}
      columns={[
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "deals", header: "Deals" },
        { key: "gci", header: "GCI", kind: "money" },
        { key: "conversion", header: "Conversion %" },
        { key: "status", header: "Status", kind: "status", domain: "campaign" },
      ]}
    />
  );
}

export function TeamPerformancePage() {
  const agents = useScopedDemoList("agents", { page_size: 50 });
  const rows = (agents.data?.results ?? []) as unknown as { name: string; gci: number; conversion: number; deals: number }[];
  return (
    <ModuleDashboard
      title="Agent Performance"
      description="Leaderboard and conversion by agent."
      stats={[
        { label: "Active agents", value: rows.filter((a) => a.deals > 0).length, icon: Users, tone: "info" },
        { label: "Team GCI", value: compactMoney(rows.reduce((s, a) => s + a.gci, 0)), icon: CircleDollarSign, tone: "success" },
        { label: "Avg conversion", value: `${Math.round(rows.reduce((s, a) => s + a.conversion, 0) / Math.max(rows.length, 1))}%`, icon: Target, tone: "primary" },
        { label: "Open deals", value: rows.reduce((s, a) => s + a.deals, 0), icon: BarChart3, tone: "warning" },
      ]}
    >
      <Panel title="Leaderboard">
        <ul className="space-y-2">
          {[...rows].sort((a, b) => b.gci - a.gci).map((a) => (
            <li key={a.name} className="flex items-center justify-between text-sm">
              <span className="font-medium">{a.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {compactMoney(a.gci)} · {a.conversion}%
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function TeamBranchesPage() {
  return (
    <ModuleDashboard
      title="Branches"
      description="Branch structure and managers."
      stats={[
        { label: "Branches", value: 1, icon: Building2, tone: "info" },
        { label: "Teams", value: 2, icon: Users, tone: "primary" },
        { label: "Agents", value: 5, icon: Users, tone: "success" },
        { label: "Coverage", value: "Central", icon: Target, tone: "muted" },
      ]}
    >
      <Panel title="Central Branch">
        <p className="text-sm text-muted-foreground">
          Manager: Morgan Branch · Currency AED · Localization en-AE. Edit branch settings from
          Settings → Org.
        </p>
      </Panel>
    </ModuleDashboard>
  );
}

export function CommissionPlansPage() {
  const mutate = useDemoMutate("commissionPlans");
  return (
    <ResourceListPage
      title="Commission Plans"
      description="Flat, tiered, and fixed commission structures."
      resource="commissionPlans"
      entity="finance"
      icon={Receipt}
      columns={[
        { key: "name", header: "Plan" },
        { key: "type", header: "Type", kind: "badge" },
        { key: "rate", header: "Rate" },
        { key: "active", header: "Active" },
      ]}
      toolbar={
        <Can roles={["owner", "super_admin"]}>
          <Button
            size="sm"
            onClick={() => {
              mutate.upsert({
                id: `cpl-${Date.now()}`,
                name: "Custom plan",
                type: "Flat percent",
                rate: "2.0%",
                active: true,
              });
              toast.success("Commission plan created (demo)");
            }}
          >
            Create plan
          </Button>
        </Can>
      }
    />
  );
}

/* ---------- Property Manager ---------- */

export function LeasesPage() {
  const mutate = useDemoMutate("leases");
  return (
    <ResourceListPage
      title="Leases"
      description="Active, expiring, renewed, and terminated leases."
      resource="leases"
      entity="lease"
      icon={KeyRound}
      statusDomain="lease"
      columns={[
        { key: "reference", header: "Ref" },
        { key: "property", header: "Property" },
        { key: "unit", header: "Unit" },
        { key: "tenant", header: "Tenant" },
        { key: "rent", header: "Rent", kind: "money" },
        { key: "end_date", header: "End", kind: "date" },
        { key: "status", header: "Status", kind: "status", domain: "lease" },
      ]}
      toolbar={
        <Can roles={["property_manager", "owner", "manager", "super_admin"]}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              mutate.patch("lease-001", { status: "renewed" });
              toast.success("Lease L-1001 renewed (demo)");
            }}
          >
            Renew expiring
          </Button>
        </Can>
      }
    />
  );
}

export function TenantsPage() {
  return (
    <ResourceListPage
      title="Tenants"
      description="Onboard and manage tenants across the portfolio."
      resource="tenants"
      entity="lease"
      icon={Users}
      statusDomain="lease"
      columns={[
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "property", header: "Property" },
        { key: "lease_status", header: "Lease", kind: "status", domain: "lease" },
        { key: "move_in", header: "Move-in", kind: "date" },
      ]}
    />
  );
}

export function RentInvoicesPage() {
  return (
    <ResourceListPage
      title="Rent Invoices"
      description="Recurring rent invoices and balances."
      resource="rentInvoices"
      entity="finance"
      icon={Receipt}
      statusDomain="finance"
      columns={[
        { key: "number", header: "Invoice" },
        { key: "contact", header: "Tenant" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "tax", header: "Tax", kind: "money" },
        { key: "due_date", header: "Due", kind: "date" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
      ]}
    />
  );
}

export function RentPaymentsPage() {
  return (
    <ResourceListPage
      title="Payments"
      description="Posted rent and fee receipts."
      resource="payments"
      entity="finance"
      icon={CircleDollarSign}
      statusDomain="finance"
      columns={[
        { key: "reference", header: "Reference" },
        { key: "payer", header: "Payer" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "method", header: "Method", kind: "badge" },
        { key: "date", header: "Date", kind: "date" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
      ]}
    />
  );
}

export function LatePaymentsPage() {
  return (
    <ResourceListPage
      title="Late Payments"
      description="Overdue rent invoices requiring follow-up."
      resource="rentInvoices"
      entity="finance"
      icon={Receipt}
      statusDomain="finance"
      fixedFilter={{ status: "overdue" }}
      columns={[
        { key: "number", header: "Invoice" },
        { key: "contact", header: "Tenant" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "due_date", header: "Due", kind: "date" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
      ]}
    />
  );
}

export function RentReportsPage() {
  const invoices = useScopedDemoList("rentInvoices", { page_size: 100 });
  const rows = invoices.data?.results ?? [];
  const overdue = rows.filter((r) => (r as unknown as { status: string }).status === "overdue");
  const paid = rows.filter((r) => (r as unknown as { status: string }).status === "paid");
  return (
    <ModuleDashboard
      title="Rent Reports"
      description="Collection rate and arrears overview."
      stats={[
        { label: "Invoices", value: rows.length, icon: FileText, tone: "info" },
        { label: "Paid", value: paid.length, icon: CircleDollarSign, tone: "success" },
        { label: "Overdue", value: overdue.length, icon: Target, tone: "destructive" },
        {
          label: "Collected",
          value: compactMoney(paid.reduce((s, r) => s + Number((r as unknown as { amount: number }).amount || 0), 0)),
          icon: Receipt,
          tone: "primary",
        },
      ]}
    />
  );
}

export function MaintenancePage() {
  const mutate = useDemoMutate("workOrders");
  return (
    <ResourceListPage
      title="Work Orders"
      description="Maintenance requests and vendor assignments."
      resource="workOrders"
      entity="property"
      icon={Wrench}
      statusDomain="maintenance"
      columns={[
        { key: "title", header: "Request" },
        { key: "property", header: "Property" },
        { key: "priority", header: "Priority", kind: "badge" },
        { key: "status", header: "Status", kind: "status", domain: "maintenance" },
        { key: "vendor", header: "Vendor" },
        { key: "cost", header: "Cost", kind: "money" },
        { key: "requested_at", header: "Requested", kind: "datetime" },
      ]}
      toolbar={
        <Can roles={["property_manager", "owner", "manager", "super_admin"]}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              mutate.patch("wo-003", { status: "assigned", vendor: "GreenScape" });
              toast.success("Work order assigned to vendor (demo)");
            }}
          >
            Assign new request
          </Button>
        </Can>
      }
    />
  );
}

export function VendorsPage() {
  return (
    <ResourceListPage
      title="Vendors"
      description="Contractors and service providers."
      resource="vendors"
      entity="property"
      icon={Users}
      columns={[
        { key: "name", header: "Vendor" },
        { key: "category", header: "Category", kind: "badge" },
        { key: "phone", header: "Phone" },
        { key: "rating", header: "Rating" },
        { key: "active", header: "Active" },
      ]}
    />
  );
}

export function MaintenanceReportsPage() {
  const wo = useScopedDemoList("workOrders", { page_size: 100 });
  const rows = wo.data?.results ?? [];
  return (
    <ModuleDashboard
      title="Maintenance Reports"
      description="Work-order volume and spend."
      stats={[
        { label: "Open", value: rows.filter((r) => !["completed", "cancelled"].includes((r as unknown as { status: string }).status)).length, icon: Wrench, tone: "warning" },
        { label: "Completed", value: rows.filter((r) => (r as unknown as { status: string }).status === "completed").length, icon: Target, tone: "success" },
        { label: "Emergency", value: rows.filter((r) => (r as unknown as { priority: string }).priority === "emergency").length, icon: Target, tone: "destructive" },
        { label: "Spend", value: compactMoney(rows.reduce((s, r) => s + Number((r as unknown as { cost: number }).cost || 0), 0)), icon: CircleDollarSign, tone: "primary" },
      ]}
    />
  );
}

export function PortfolioReportsPage() {
  const leases = useScopedDemoList("leases", { page_size: 100 });
  const rows = leases.data?.results ?? [];
  const active = rows.filter((r) => (r as unknown as { status: string }).status === "active").length;
  return (
    <ModuleDashboard
      title="Portfolio Reports"
      description="Occupancy and lease health."
      stats={[
        { label: "Leases", value: rows.length, icon: KeyRound, tone: "info" },
        { label: "Active", value: active, icon: Target, tone: "success" },
        { label: "Expiring", value: rows.filter((r) => (r as unknown as { status: string }).status === "expiring").length, icon: Target, tone: "warning" },
        { label: "Occupancy", value: `${Math.round((active / Math.max(rows.length, 1)) * 100)}%`, icon: BarChart3, tone: "primary" },
      ]}
    />
  );
}

export { OccupancyReportsPage } from "../property-manager/PropertyManagerPages";

/* ---------- Finance ---------- */

export function CommissionsPage() {
  const mutate = useDemoMutate("commissions");
  return (
    <ResourceListPage
      title="Commissions"
      description="Calculate, approve, and pay agent commissions."
      resource="commissions"
      entity="finance"
      icon={Receipt}
      statusDomain="finance"
      columns={[
        { key: "agent", header: "Agent" },
        { key: "deal", header: "Deal" },
        { key: "gross", header: "Gross", kind: "money" },
        { key: "net", header: "Net", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
        { key: "period", header: "Period" },
      ]}
      toolbar={
        <Can roles={["finance", "owner", "super_admin"]}>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                mutate.patch("com-001", { status: "approved" });
                toast.success("Pending commissions approved (demo)");
              }}
            >
              Approve pending
            </Button>
            <Button
              size="sm"
              onClick={() => {
                mutate.patch("com-002", { status: "paid" });
                toast.success("Approved commissions marked paid (demo)");
              }}
            >
              Pay approved
            </Button>
          </div>
        </Can>
      }
    />
  );
}

export function InvoicesPage() {
  const mutate = useDemoMutate("invoices");
  return (
    <ResourceListPage
      title="Invoices"
      description="Agency client invoices — sale, commission, and fees. Not the property-manager rent roll."
      resource="invoices"
      entity="finance"
      icon={FileText}
      statusDomain="finance"
      columns={[
        { key: "number", header: "Number" },
        { key: "contact", header: "Contact" },
        { key: "type", header: "Type", kind: "badge" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "tax", header: "VAT", kind: "money" },
        { key: "due_date", header: "Due", kind: "date" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
      ]}
      toolbar={
        <Can roles={["finance", "owner", "super_admin"]}>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                mutate.patch("inv-005", { status: "void" });
                toast.success("Draft invoice voided (demo)");
              }}
            >
              Void draft
            </Button>
            <Button
              size="sm"
              onClick={() => {
                mutate.patch("inv-006", { status: "paid" });
                toast.success("Issued invoice marked paid (demo)");
              }}
            >
              Mark paid
            </Button>
          </div>
        </Can>
      }
    />
  );
}

export function TransactionsPage() {
  return (
    <ResourceListPage
      title="Transactions"
      description="Operating and trust account movements."
      resource="transactions"
      entity="finance"
      icon={CircleDollarSign}
      statusDomain="finance"
      columns={[
        { key: "reference", header: "Reference" },
        { key: "type", header: "Type" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "account", header: "Account", kind: "badge" },
        { key: "date", header: "Date", kind: "date" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
      ]}
    />
  );
}

export function VatReportsPage() {
  const invoices = useScopedDemoList("invoices", { page_size: 100 });
  const rows = invoices.data?.results ?? [];
  const tax = rows.reduce((s, r) => s + Number((r as unknown as { tax: number }).tax || 0), 0);
  return (
    <ModuleDashboard
      title="VAT Reports"
      description="Tax collected and payable summary."
      stats={[
        { label: "VAT collected", value: compactMoney(tax), icon: Receipt, tone: "success" },
        { label: "Taxable invoices", value: rows.length, icon: FileText, tone: "info" },
        { label: "Rate", value: "5%", icon: Target, tone: "primary" },
        {
          label: "Period",
          value: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
          icon: BarChart3,
          tone: "muted",
        },
      ]}
      actions={
        <Can roles={["finance", "owner", "super_admin"]}>
          <Button onClick={() => toast.success("VAT return exported (demo).")}>
            Export VAT return
          </Button>
        </Can>
      }
    />
  );
}

export function FinanceReportsPage() {
  const tx = useScopedDemoList("transactions", { page_size: 100 });
  const rows = tx.data?.results ?? [];
  const completed = rows.filter((r) => (r as unknown as { status: string }).status === "completed");
  return (
    <ModuleDashboard
      title="Financial Reports"
      description="Revenue, payouts, and cash position."
      stats={[
        {
          label: "Completed volume",
          value: compactMoney(completed.reduce((s, r) => s + Number((r as unknown as { amount: number }).amount || 0), 0)),
          icon: CircleDollarSign,
          tone: "success",
        },
        { label: "Transactions", value: rows.length, icon: FileText, tone: "info" },
        { label: "Pending", value: rows.filter((r) => (r as unknown as { status: string }).status === "pending").length, icon: Target, tone: "warning" },
        { label: "Trust items", value: rows.filter((r) => (r as unknown as { account: string }).account === "Trust").length, icon: Shield, tone: "primary" },
      ]}
    />
  );
}

export { CommissionSummaryPage, PnLPage, MilestonesPage } from "../finance/FinancePages";

export function ReconciliationPage() {
  return (
    <ModuleDashboard
      title="Reconciliation"
      description="Bank / trust / clearing reconciliation."
      stats={[
        { label: "Opening", value: compactMoney(120400), icon: CircleDollarSign, tone: "muted" },
        { label: "Statement close", value: compactMoney(134200), icon: FileText, tone: "info" },
        { label: "System close", value: compactMoney(134200), icon: Target, tone: "success" },
        { label: "Difference", value: compactMoney(0), icon: Shield, tone: "success" },
      ]}
      actions={
        <Can roles={["finance", "owner", "super_admin"]}>
          <Button onClick={() => toast.success("Statement matched (demo).")}>Match statement</Button>
        </Can>
      }
    >
      <Panel title="Status">
        <StatusBadge value="Reconciled" tone="success" />
        <p className="mt-2 text-sm text-muted-foreground">
          Trust and operating accounts match the Aug bank statement (demo).
        </p>
      </Panel>
    </ModuleDashboard>
  );
}

export function AccountingExportPage() {
  return (
    <ModuleDashboard
      title="Accounting Export"
      description="Export to QuickBooks / Xero."
      stats={[
        { label: "Last export", value: "2d ago", icon: Plug, tone: "info" },
        { label: "Format", value: "XLSX", icon: FileText, tone: "primary" },
        { label: "Rows", value: 248, icon: BarChart3, tone: "muted" },
        { label: "Status", value: "OK", icon: Target, tone: "success" },
      ]}
      actions={
        <Can roles={["finance", "owner", "super_admin"]}>
          <Button
            onClick={() => toast.success("Demo export queued — file would download in production.")}
          >
            Export now
          </Button>
        </Can>
      }
    />
  );
}


/* ---------- Marketing ---------- */

export function CampaignsPage() {
  const mutate = useDemoMutate("campaigns");

  const createDraft = useCallback(() => {
    mutate.upsert({
      id: `camp-${Date.now()}`,
      name: "New campaign draft",
      channel: "Email",
      status: "draft",
      budget: 0,
      leads: 0,
      spend: 0,
      start_date: new Date().toISOString().slice(0, 10),
    });
    toast.success("Draft campaign saved (demo). Owner approves before it goes live.");
  }, [mutate]);

  return (
    <ResourceListPage
      title="Campaigns"
      description="Marketing builds drafts, drips, and ads. Owner approves before a campaign goes live."
      resource="campaigns"
      entity="lead"
      icon={Target}
      statusDomain="campaign"
      columns={[
        { key: "name", header: "Campaign" },
        { key: "channel", header: "Channel", kind: "badge" },
        { key: "status", header: "Status", kind: "status", domain: "campaign" },
        { key: "budget", header: "Budget", kind: "money" },
        { key: "spend", header: "Spend", kind: "money" },
        { key: "leads", header: "Leads" },
        { key: "start_date", header: "Started", kind: "date" },
      ]}
      onNew={createDraft}
      toolbar={
        <Can roles={["marketing", "super_admin"]}>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={createDraft}>
              Save draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                mutate.patch("camp-003", { status: "paused" });
                toast.success("Campaign paused (demo)");
              }}
            >
              Pause campaign
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                mutate.patch("camp-001", { budget: 15000 });
                toast.success("Campaign budget updated (demo)");
              }}
            >
              Edit budget
            </Button>
          </div>
        </Can>
      }
    />
  );
}

export function EmailTemplatesPage() {
  return (
    <ResourceListPage
      title="Email Templates"
      description="Design templates and track engagement."
      resource="emailTemplates"
      entity="lead"
      icon={FileText}
      columns={[
        { key: "name", header: "Template" },
        { key: "subject", header: "Subject" },
        { key: "channel", header: "Channel", kind: "badge" },
        { key: "opens", header: "Opens" },
        { key: "clicks", header: "Clicks" },
      ]}
    />
  );
}

export {
  DripSequencesPage,
  EmailTrackingPage,
  SocialAdsPage,
  SocialLeadsPage,
} from "../marketing/MarketingPages";

export function LandingPagesPage() {
  return (
    <ResourceListPage
      title="Landing Pages"
      description="No-code landing pages and capture forms."
      resource="landingPages"
      entity="lead"
      icon={Building2}
      fixedFilter={{ kind: "landing" }}
      columns={[
        { key: "title", header: "Page" },
        { key: "slug", header: "Slug" },
        { key: "views", header: "Views" },
        { key: "submissions", header: "Submissions" },
        { key: "published", header: "Published" },
      ]}
    />
  );
}

export { MicrositesPage, WebsiteAnalyticsPage, MarketingRoiPage } from "../marketing/MarketingPages";

export function MarketingReportsPage() {
  const campaigns = useScopedDemoList("campaigns", { page_size: 50 });
  const rows = campaigns.data?.results ?? [];
  const spend = rows.reduce((s, r) => s + Number((r as unknown as { spend: number }).spend || 0), 0);
  const leads = rows.reduce((s, r) => s + Number((r as unknown as { leads: number }).leads || 0), 0);
  return (
    <ModuleDashboard
      title="Marketing Reports"
      description="Campaign ROI and budget tracking."
      stats={[
        { label: "Spend", value: compactMoney(spend), icon: CircleDollarSign, tone: "warning" },
        { label: "Leads", value: leads, icon: Users, tone: "info" },
        { label: "CPL", value: compactMoney(spend / Math.max(leads, 1)), icon: Target, tone: "primary" },
        { label: "Campaigns", value: rows.length, icon: BarChart3, tone: "success" },
      ]}
    />
  );
}

export function LeaderboardReportPage() {
  return <TeamPerformancePage />;
}

export function RoiReportPage() {
  return <MarketingRoiPage />;
}

export function CustomReportPage() {
  return (
    <ModuleDashboard
      title="Custom Reports"
      description="Build and schedule saved reports."
      stats={[
        { label: "Saved", value: 6, icon: FileText, tone: "info" },
        { label: "Scheduled", value: 2, icon: Target, tone: "primary" },
        { label: "Shared", value: 3, icon: Users, tone: "success" },
        { label: "Exports", value: 18, icon: BarChart3, tone: "muted" },
      ]}
    />
  );
}
