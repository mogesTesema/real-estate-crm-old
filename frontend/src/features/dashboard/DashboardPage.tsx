import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../lib/auth";
import type { RoleKey } from "../../lib/roles";
import { AgentDashboard } from "./AgentDashboard";
import { FinanceDashboard } from "./FinanceDashboard";
import { ManagerDashboard } from "./ManagerDashboard";
import { MarketingDashboard } from "./MarketingDashboard";
import { OwnerDashboard } from "./OwnerDashboard";
import { PortalDashboard } from "./PortalDashboard";
import { PropertyManagerDashboard } from "./PropertyManagerDashboard";
import { SuperAdminDashboard } from "./SuperAdminDashboard";

export function DashboardPage() {
  const { me } = useAuth();
  const role = (me?.role ?? "agent") as RoleKey;
  const meId = me?.id ?? "";

  const titles: Partial<Record<RoleKey, string>> = {
    super_admin: "System Overview",
    agent: "My Performance",
    manager: "Branch Overview",
    owner: "Agency Overview",
    property_manager: "Portfolio Overview",
    finance: "Financial Overview",
    marketing: "Campaign Overview",
    portal: "My Activity",
  };

  const subtitles: Partial<Record<RoleKey, string>> = {
    super_admin: "Configuration, users, security, and integrations at a glance.",
    agent: "Your day — own leads, deals, viewings, and field GPS.",
    manager: "Owners, team pipeline, routing, commissions, and field GPS at a glance.",
    owner: "Agency revenue, GCI, closed deals, and team performance.",
    property_manager: "Occupancy, leases, rent collection, and maintenance.",
    finance: "Commissions, invoices, and pending payments.",
    marketing: "Campaign performance, lead generation, and ROI.",
    portal: "Your deals, documents, lease, and notifications.",
  };

  return (
    <div>
      <PageHeader
        title={titles[role] ?? "Dashboard"}
        description={subtitles[role] ?? "Your workspace at a glance."}
      />
      {role === "super_admin" ? (
        <SuperAdminDashboard />
      ) : role === "owner" ? (
        <OwnerDashboard meId={meId} />
      ) : role === "manager" ? (
        <ManagerDashboard meId={meId} />
      ) : role === "property_manager" ? (
        <PropertyManagerDashboard />
      ) : role === "finance" ? (
        <FinanceDashboard />
      ) : role === "marketing" ? (
        <MarketingDashboard />
      ) : role === "portal" ? (
        <PortalDashboard />
      ) : (
        <AgentDashboard meId={meId} />
      )}
    </div>
  );
}
