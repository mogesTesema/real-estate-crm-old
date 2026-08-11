import {
  BarChart3,
  Building2,
  CircleDollarSign,
  FileText,
  HelpCircle,
  KeyRound,
  Plug,
  Receipt,
  Shield,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { ResourceListPage } from "../../components/ResourceListPage";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { useDemoMutate, useScopedDemoList } from "../../lib/demo";
import { compactMoney } from "../../lib/format";
import { humanize } from "../../lib/status";
import { CalendarPage } from "./CalendarPage";

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

export function OccupancyReportsPage() {
  return <PortfolioReportsPage />;
}

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
      description="Client invoices across sale, rent, and fees."
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
        { label: "Period", value: "Aug 2026", icon: BarChart3, tone: "muted" },
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

export function PnLPage() {
  return (
    <ModuleDashboard
      title="Profit / Loss"
      description="Agency P&L snapshot (demo)."
      stats={[
        { label: "Revenue", value: compactMoney(428000), icon: CircleDollarSign, tone: "success" },
        { label: "COGS / splits", value: compactMoney(186000), icon: Receipt, tone: "warning" },
        { label: "OpEx", value: compactMoney(92000), icon: FileText, tone: "info" },
        { label: "Net", value: compactMoney(150000), icon: Target, tone: "primary" },
      ]}
    />
  );
}

export function MilestonesPage() {
  return <TransactionsPage />;
}

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

export function CommissionSummaryPage() {
  return <MyCommissionReportPage />;
}

/* ---------- Marketing ---------- */

export function CampaignsPage() {
  const mutate = useDemoMutate("campaigns");
  return (
    <ResourceListPage
      title="Campaigns"
      description="Email, ads, and nurture campaigns."
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
      toolbar={
        <Can roles={["marketing", "owner", "super_admin"]}>
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

export function DripSequencesPage() {
  return (
    <ModuleDashboard
      title="Drip Sequences"
      description="Lead nurturing automations."
      stats={[
        { label: "Active drips", value: 3, icon: Target, tone: "success" },
        { label: "Enrolled", value: 164, icon: Users, tone: "info" },
        { label: "Avg open", value: "38%", icon: BarChart3, tone: "primary" },
        { label: "Conversions", value: 22, icon: CircleDollarSign, tone: "warning" },
      ]}
    >
      <Panel title="Buyer Nurture Drip">
        <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
          <li>Day 0 — Welcome + preference capture</li>
          <li>Day 2 — Matching listings digest</li>
          <li>Day 5 — Social proof / recent sales</li>
          <li>Day 10 — Soft CTA to book a viewing</li>
        </ol>
      </Panel>
    </ModuleDashboard>
  );
}

export function EmailTrackingPage() {
  return <EmailTemplatesPage />;
}

export function SocialAdsPage() {
  return <CampaignsPage />;
}

export function SocialLeadsPage() {
  return (
    <ModuleDashboard
      title="Lead Ads Capture"
      description="Facebook / Instagram lead ads intake."
      stats={[
        { label: "Forms live", value: 4, icon: Target, tone: "success" },
        { label: "Leads (30d)", value: 86, icon: Users, tone: "info" },
        { label: "Cost / lead", value: compactMoney(86), icon: CircleDollarSign, tone: "warning" },
        { label: "Synced", value: "100%", icon: Plug, tone: "primary" },
      ]}
    />
  );
}

export function LandingPagesPage() {
  return (
    <ResourceListPage
      title="Landing Pages"
      description="No-code landing pages and capture forms."
      resource="landingPages"
      entity="lead"
      icon={Building2}
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

export function MicrositesPage() {
  return <LandingPagesPage />;
}

export function WebsiteAnalyticsPage() {
  return (
    <ModuleDashboard
      title="Website Analytics"
      description="Traffic and conversion for public pages."
      stats={[
        { label: "Sessions", value: "12.4k", icon: BarChart3, tone: "info" },
        { label: "Bounce", value: "41%", icon: Target, tone: "warning" },
        { label: "Form CVR", value: "3.2%", icon: Users, tone: "success" },
        { label: "Top page", value: "Marina", icon: Building2, tone: "primary" },
      ]}
    />
  );
}

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

export function MarketingRoiPage() {
  return <MarketingReportsPage />;
}

/* ---------- Portal ---------- */

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
  return <PortalFavoritesPage />;
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
      description="Active offers and closed transactions."
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
  return <DocumentsPage />;
}

export function PortalSchedulePage() {
  return <CalendarPage />;
}

export function PortalLeasePage() {
  const leases = useScopedDemoList("leases", {
    status: "active",
    leaseRole: "tenant",
    page_size: 5,
  });
  const lease = leases.data?.results?.[0] as unknown as
    | {
        reference: string;
        property: string;
        unit: string;
        rent: number;
        end_date: string;
        status: string;
      }
    | undefined;
  return (
    <ModuleDashboard
      title="Active Lease"
      description="Your current lease terms."
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
  return <RentPaymentsPage />;
}

export function PortalLeaseMaintenancePage() {
  return <MaintenancePage />;
}

export function PortalLeaseDocumentsPage() {
  return <DocumentsPage />;
}

export function PortalLandlordPropertiesPage() {
  return <PortalFavoritesPage />;
}

export function PortalLandlordPerformancePage() {
  return <PortfolioReportsPage />;
}

export function PortalLandlordStatementsPage() {
  return (
    <ResourceListPage
      title="Rent Statements"
      description="Owner remittance statements."
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
      description="Leases on properties you own."
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

/* ---------- Super Admin ---------- */

export function AdminAnalyticsPage() {
  return (
    <ModuleDashboard
      title="System Analytics"
      description="Platform health and usage."
      stats={[
        { label: "Uptime", value: "99.98%", icon: Shield, tone: "success" },
        { label: "Active users", value: 1284, icon: Users, tone: "info" },
        { label: "API p95", value: "180ms", icon: BarChart3, tone: "primary" },
        { label: "Error rate", value: "0.04%", icon: Target, tone: "warning" },
      ]}
    />
  );
}

export function AdminUsersPage() {
  return <TeamAgentsPage />;
}

export function AdminRolesPage() {
  const roles = [
    "super_admin",
    "owner",
    "manager",
    "agent",
    "property_manager",
    "marketing",
    "finance",
    "portal",
  ];
  return (
    <ModuleDashboard
      title="Roles & Permissions"
      description="System roles and module access."
      stats={[
        { label: "Roles", value: roles.length, icon: Shield, tone: "info" },
        { label: "Modules", value: 14, icon: KeyRound, tone: "primary" },
        { label: "Custom roles", value: 0, icon: Users, tone: "muted" },
        { label: "SSO", value: "Ready", icon: Plug, tone: "success" },
      ]}
      actions={
        <Can roles={["super_admin"]}>
          <Button onClick={() => toast.success("Role assignment saved (demo).")}>
            Change user role
          </Button>
        </Can>
      }
    >
      <Panel title="Role catalogue">
        <ul className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <StatusBadge key={r} value={humanize(r)} tone="primary" />
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminTenantsPage() {
  const mutate = useDemoMutate("tenantsAccounts");
  return (
    <ResourceListPage
      title="Companies / Tenants"
      description="SaaS tenant accounts (verbatim admin dashboard)."
      resource="tenantsAccounts"
      entity="muted"
      icon={Building2}
      statusDomain="campaign"
      columns={[
        { key: "name", header: "Company" },
        { key: "plan", header: "Plan", kind: "badge" },
        { key: "users", header: "Users" },
        { key: "mrr", header: "MRR", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "campaign" },
      ]}
      toolbar={
        <Can roles={["super_admin"]}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              mutate.patch("ten-004", { status: "suspended", mrr: 0 });
              toast.success("Tenant suspended (demo)");
            }}
          >
            Suspend tenant
          </Button>
          <Button
            size="sm"
            onClick={() => {
              mutate.upsert({
                id: `ten-${Date.now()}`,
                name: "New Demo Co",
                plan: "Starter",
                users: 1,
                status: "trial",
                mrr: 0,
              });
              toast.success("Tenant created (demo)");
            }}
          >
            Create tenant
          </Button>
        </Can>
      }
    />
  );
}

export function AdminAuditPage() {
  return (
    <ResourceListPage
      title="Audit Log"
      description="Immutable security and operational events."
      resource="auditEvents"
      entity="muted"
      icon={FileText}
      columns={[
        { key: "actor", header: "Actor" },
        { key: "action", header: "Action", kind: "badge" },
        { key: "entity", header: "Entity" },
        { key: "ip", header: "IP" },
        { key: "at", header: "When", kind: "datetime" },
      ]}
    />
  );
}

export function AdminBackupPage() {
  return (
    <ModuleDashboard
      title="Data Backup"
      description="Automated backups and disaster recovery."
      stats={[
        { label: "Last backup", value: "02:00 UTC", icon: Shield, tone: "success" },
        { label: "Retention", value: "30 days", icon: FileText, tone: "info" },
        { label: "RPO", value: "15 min", icon: Target, tone: "primary" },
        { label: "Status", value: "Healthy", icon: BarChart3, tone: "success" },
      ]}
      actions={<Button onClick={() => toast.success("Demo backup triggered.")}>Run backup</Button>}
    />
  );
}

export function AdminRevenueReportsPage() {
  return (
    <ModuleDashboard
      title="Revenue Reports"
      description="Platform subscription revenue."
      stats={[
        { label: "MRR", value: compactMoney(3398), icon: CircleDollarSign, tone: "success" },
        { label: "ARR", value: compactMoney(40776), icon: BarChart3, tone: "info" },
        { label: "Churn", value: "1.2%", icon: Target, tone: "warning" },
        { label: "Paying tenants", value: 2, icon: Building2, tone: "primary" },
      ]}
    />
  );
}

export function AdminUsageReportsPage() {
  return <AdminAnalyticsPage />;
}

export function AdminEmailSettingsPage() {
  return (
    <ModuleDashboard
      title="Email Settings"
      description="Outbound mail provider configuration."
      stats={[
        { label: "Provider", value: "Mailgun", icon: Plug, tone: "info" },
        { label: "Domain", value: "Verified", icon: Shield, tone: "success" },
        { label: "Daily cap", value: "50k", icon: BarChart3, tone: "primary" },
        { label: "Bounce", value: "0.3%", icon: Target, tone: "warning" },
      ]}
    />
  );
}

export function AdminSmsSettingsPage() {
  return (
    <ModuleDashboard
      title="SMS / WhatsApp Settings"
      description="Messaging connectors."
      stats={[
        { label: "SMS", value: "Twilio", icon: Plug, tone: "info" },
        { label: "WhatsApp", value: "Connected", icon: Shield, tone: "success" },
        { label: "Credits", value: "12,400", icon: CircleDollarSign, tone: "primary" },
        { label: "Opt-outs", value: 18, icon: Users, tone: "muted" },
      ]}
    />
  );
}

export function AdminApiKeysPage() {
  return (
    <ResourceListPage
      title="API Keys"
      description="Manage programmatic access."
      resource="apiKeys"
      entity="muted"
      icon={KeyRound}
      columns={[
        { key: "name", header: "Name" },
        { key: "prefix", header: "Key" },
        { key: "created_at", header: "Created", kind: "date" },
        { key: "last_used", header: "Last used", kind: "datetime" },
      ]}
    />
  );
}

export function AdminWebhooksPage() {
  return (
    <ResourceListPage
      title="Webhooks"
      description="Outbound event subscriptions."
      resource="webhooks"
      entity="muted"
      icon={Plug}
      statusDomain="campaign"
      columns={[
        { key: "url", header: "URL" },
        { key: "events", header: "Events" },
        { key: "status", header: "Status", kind: "status", domain: "campaign" },
      ]}
    />
  );
}

export function AdminPlansPage() {
  return (
    <ModuleDashboard
      title="Plans & Pricing"
      description="Subscription catalogue."
      stats={[
        { label: "Starter", value: compactMoney(199), icon: Receipt, tone: "muted" },
        { label: "Professional", value: compactMoney(899), icon: CircleDollarSign, tone: "primary" },
        { label: "Enterprise", value: compactMoney(2499), icon: Shield, tone: "success" },
        { label: "Trials", value: 1, icon: Users, tone: "info" },
      ]}
    />
  );
}

export function AdminSubInvoicesPage() {
  return (
    <ResourceListPage
      title="Subscription Invoices"
      description="Billing invoices for tenants."
      resource="subscriptions"
      entity="finance"
      icon={Receipt}
      statusDomain="finance"
      columns={[
        { key: "customer", header: "Customer" },
        { key: "plan", header: "Plan", kind: "badge" },
        { key: "amount", header: "Amount", kind: "money" },
        { key: "status", header: "Status", kind: "status", domain: "finance" },
        { key: "renews", header: "Renews", kind: "date" },
      ]}
    />
  );
}

export function AdminCustomersPage() {
  return <AdminTenantsPage />;
}

export function HelpDocsPage() {
  return (
    <ModuleDashboard
      title="Documentation"
      description="Product guides and API references."
      stats={[
        { label: "Guides", value: 42, icon: HelpCircle, tone: "info" },
        { label: "API refs", value: 18, icon: FileText, tone: "primary" },
        { label: "Videos", value: 12, icon: Target, tone: "success" },
        { label: "Updated", value: "Today", icon: BarChart3, tone: "muted" },
      ]}
    >
      <Panel title="Quick links">
        <ul className="space-y-1 text-sm text-primary">
          <li>Getting started with roles</li>
          <li>Lead routing playbook</li>
          <li>Commission approval workflow</li>
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function HelpChatPage() {
  return (
    <ModuleDashboard
      title="Support Chat"
      description="Talk to EstateCRM support."
      stats={[
        { label: "Queue", value: "Online", icon: HelpCircle, tone: "success" },
        { label: "Avg wait", value: "2m", icon: Target, tone: "info" },
        { label: "Open tickets", value: 3, icon: FileText, tone: "warning" },
        { label: "CSAT", value: "4.8", icon: Users, tone: "primary" },
      ]}
    />
  );
}

export function HelpTrainingPage() {
  return <HelpDocsPage />;
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
