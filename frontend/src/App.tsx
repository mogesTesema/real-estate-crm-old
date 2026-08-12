import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "./components/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ForbiddenPage, NotFoundPage } from "./components/ErrorPages";
import { Skeleton } from "./components/ui/skeleton";
import { useAuth } from "./lib/auth";
import { canAccess } from "./lib/roles";
import { LoginPage } from "./features/auth/LoginPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { LeadsPage } from "./features/leads/LeadsPage";
import { ContactsPage } from "./features/contacts/ContactsPage";
import { PropertiesPage } from "./features/properties/PropertiesPage";
import { PipelinePage } from "./features/pipeline/PipelinePage";
import { SettingsPage } from "./features/settings/SettingsPage";
import * as Modules from "./features/modules/ModulePages";
import { CalendarPage } from "./features/modules/CalendarPage";
import { CommsPage, CommsTemplatesPage } from "./features/modules/CommsPage";

const LeadAnalyticsPage = lazy(() =>
  import("./features/leads/LeadAnalyticsPage").then((m) => ({ default: m.LeadAnalyticsPage })),
);
const LeadRoutingPage = lazy(() =>
  import("./features/leads/LeadRoutingPage").then((m) => ({ default: m.LeadRoutingPage })),
);
const LeadSourcesPage = lazy(() =>
  import("./features/leads/LeadSourcesPage").then((m) => ({ default: m.LeadSourcesPage })),
);
const ImportContactsPage = lazy(() =>
  import("./features/contacts/ImportContactsPage").then((m) => ({ default: m.ImportContactsPage })),
);
const PropertyDetailPage = lazy(() =>
  import("./features/properties/PropertyDetailPage").then((m) => ({ default: m.PropertyDetailPage })),
);
const PropertyAnalyticsPage = lazy(() =>
  import("./features/properties/PropertyAnalyticsPage").then((m) => ({
    default: m.PropertyAnalyticsPage,
  })),
);
const PropertySearchPage = lazy(() =>
  import("./features/properties/PropertySearchPage").then((m) => ({
    default: m.PropertySearchPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("./features/properties/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const ForecastPage = lazy(() =>
  import("./features/pipeline/ForecastPage").then((m) => ({ default: m.ForecastPage })),
);
const ReportsPage = lazy(() =>
  import("./features/reports/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./features/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
);
const OnboardingPage = lazy(() =>
  import("./features/auth/OnboardingPage").then((m) => ({ default: m.OnboardingPage })),
);
const MfaPage = lazy(() =>
  import("./features/auth/MfaPage").then((m) => ({ default: m.MfaPage })),
);
const SsoCallbackPage = lazy(() =>
  import("./features/auth/SsoCallbackPage").then((m) => ({ default: m.SsoCallbackPage })),
);

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const location = useLocation();
  const allowed = canAccess(me?.role, location.pathname);

  useEffect(() => {
    if (!allowed) toast.error("Your role doesn't have access to that page.");
  }, [allowed]);

  if (!allowed) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

function PipelineByLine() {
  const { line } = useParams<{ line: string }>();
  return (
    <Guard>
      <PipelinePage businessLine={line === "leasing" ? "leasing" : "sales"} />
    </Guard>
  );
}

function SettingsSectionRedirect() {
  const { section } = useParams<{ section: string }>();
  const map: Record<string, string> = {
    profile: "profile",
    notifications: "notifications",
    "custom-fields": "fields",
    fields: "fields",
    companies: "org",
    branches: "org",
    teams: "org",
    org: "org",
    roles: "roles",
    security: "security",
  };
  const tab = map[section ?? ""] ?? "profile";
  return <Navigate to={`/settings?tab=${tab}`} replace />;
}

function P({ children }: { children: React.ReactNode }) {
  return <Guard>{children}</Guard>;
}

function MP({ Comp }: { Comp: ComponentType }) {
  return (
    <P>
      <Comp />
    </P>
  );
}

export function App() {
  const { me, loading, loadMe, mfaPending } = useAuth();

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!me || mfaPending) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/mfa" element={<MfaPage />} />
          <Route path="/sso/callback" element={<SsoCallbackPage />} />
          <Route
            path="*"
            element={<Navigate to={mfaPending ? "/mfa" : "/login"} replace />}
          />
        </Routes>
      </Suspense>
    );
  }

  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={<P><DashboardPage /></P>} />
            <Route path="/leads" element={<P><LeadsPage /></P>} />
            <Route path="/leads/analytics" element={<P><LeadAnalyticsPage /></P>} />
            <Route path="/leads/routing" element={<P><LeadRoutingPage /></P>} />
            <Route path="/leads/sources" element={<P><LeadSourcesPage /></P>} />
            <Route path="/contacts" element={<P><ContactsPage /></P>} />
            <Route path="/contacts/import" element={<P><ImportContactsPage /></P>} />
            <Route path="/properties" element={<P><PropertiesPage /></P>} />
            <Route path="/properties/search" element={<P><PropertySearchPage /></P>} />
            <Route path="/properties/analytics" element={<P><PropertyAnalyticsPage /></P>} />
            <Route path="/properties/:id" element={<P><PropertyDetailPage /></P>} />
            <Route path="/projects" element={<P><ProjectsPage /></P>} />
            <Route path="/pipeline" element={<P><PipelinePage /></P>} />
            <Route path="/pipeline/sales" element={<PipelineByLine />} />
            <Route path="/pipeline/leasing" element={<PipelineByLine />} />
            <Route path="/pipeline/forecast" element={<P><ForecastPage /></P>} />
            <Route path="/reports" element={<P><ReportsPage /></P>} />
            <Route path="/settings" element={<P><SettingsPage /></P>} />
            <Route path="/settings/:section" element={<SettingsSectionRedirect />} />

            <Route path="/calendar" element={<P><CalendarPage /></P>} />
            <Route path="/comms" element={<P><CommsPage /></P>} />
            <Route path="/comms/templates" element={<P><CommsTemplatesPage /></P>} />
            <Route path="/documents" element={<MP Comp={Modules.DocumentsPage} />} />

            <Route path="/team/agents" element={<MP Comp={Modules.TeamAgentsPage} />} />
            <Route path="/team/performance" element={<MP Comp={Modules.TeamPerformancePage} />} />
            <Route path="/team/branches" element={<MP Comp={Modules.TeamBranchesPage} />} />
            <Route path="/team/commission-plans" element={<MP Comp={Modules.CommissionPlansPage} />} />

            <Route path="/leases" element={<MP Comp={Modules.LeasesPage} />} />
            <Route path="/tenants" element={<MP Comp={Modules.TenantsPage} />} />
            <Route path="/rent/invoices" element={<MP Comp={Modules.RentInvoicesPage} />} />
            <Route path="/rent/payments" element={<MP Comp={Modules.RentPaymentsPage} />} />
            <Route path="/rent/reports" element={<MP Comp={Modules.RentReportsPage} />} />
            <Route path="/rent/late" element={<MP Comp={Modules.LatePaymentsPage} />} />
            <Route path="/maintenance" element={<MP Comp={Modules.MaintenancePage} />} />
            <Route path="/maintenance/vendors" element={<MP Comp={Modules.VendorsPage} />} />
            <Route path="/maintenance/reports" element={<MP Comp={Modules.MaintenanceReportsPage} />} />

            <Route path="/finance/commissions" element={<MP Comp={Modules.CommissionsPage} />} />
            <Route path="/finance/invoices" element={<MP Comp={Modules.InvoicesPage} />} />
            <Route path="/finance/transactions" element={<MP Comp={Modules.TransactionsPage} />} />
            <Route path="/finance/vat" element={<MP Comp={Modules.VatReportsPage} />} />
            <Route path="/finance/reports" element={<MP Comp={Modules.FinanceReportsPage} />} />
            <Route path="/finance/reports/commission" element={<MP Comp={Modules.CommissionSummaryPage} />} />
            <Route path="/finance/reports/pnl" element={<MP Comp={Modules.PnLPage} />} />
            <Route path="/finance/milestones" element={<MP Comp={Modules.MilestonesPage} />} />
            <Route path="/finance/reconciliation" element={<MP Comp={Modules.ReconciliationPage} />} />
            <Route path="/finance/integrations/export" element={<MP Comp={Modules.AccountingExportPage} />} />

            <Route path="/marketing/campaigns" element={<MP Comp={Modules.CampaignsPage} />} />
            <Route path="/marketing/email/templates" element={<MP Comp={Modules.EmailTemplatesPage} />} />
            <Route path="/marketing/email/drip" element={<MP Comp={Modules.DripSequencesPage} />} />
            <Route path="/marketing/email/tracking" element={<MP Comp={Modules.EmailTrackingPage} />} />
            <Route path="/marketing/social" element={<MP Comp={Modules.SocialAdsPage} />} />
            <Route path="/marketing/social/leads" element={<MP Comp={Modules.SocialLeadsPage} />} />
            <Route path="/marketing/website/landing" element={<MP Comp={Modules.LandingPagesPage} />} />
            <Route path="/marketing/website/microsites" element={<MP Comp={Modules.MicrositesPage} />} />
            <Route path="/marketing/website/analytics" element={<MP Comp={Modules.WebsiteAnalyticsPage} />} />
            <Route path="/marketing/reports" element={<MP Comp={Modules.MarketingReportsPage} />} />
            <Route path="/marketing/reports/roi" element={<MP Comp={Modules.MarketingRoiPage} />} />

            <Route path="/portal/searches" element={<MP Comp={Modules.PortalSearchesPage} />} />
            <Route path="/portal/matches" element={<MP Comp={Modules.PortalMatchesPage} />} />
            <Route path="/portal/favorites" element={<MP Comp={Modules.PortalFavoritesPage} />} />
            <Route path="/portal/deals" element={<MP Comp={Modules.PortalDealsPage} />} />
            <Route path="/portal/offers" element={<MP Comp={Modules.PortalOffersPage} />} />
            <Route path="/portal/documents" element={<MP Comp={Modules.PortalDocumentsPage} />} />
            <Route path="/portal/schedule" element={<MP Comp={Modules.PortalSchedulePage} />} />
            <Route path="/portal/lease" element={<MP Comp={Modules.PortalLeasePage} />} />
            <Route path="/portal/lease/payments" element={<MP Comp={Modules.PortalLeasePaymentsPage} />} />
            <Route path="/portal/lease/maintenance" element={<MP Comp={Modules.PortalLeaseMaintenancePage} />} />
            <Route path="/portal/lease/documents" element={<MP Comp={Modules.PortalLeaseDocumentsPage} />} />
            <Route path="/portal/landlord/properties" element={<MP Comp={Modules.PortalLandlordPropertiesPage} />} />
            <Route path="/portal/landlord/performance" element={<MP Comp={Modules.PortalLandlordPerformancePage} />} />
            <Route path="/portal/landlord/statements" element={<MP Comp={Modules.PortalLandlordStatementsPage} />} />
            <Route path="/portal/landlord/leases" element={<MP Comp={Modules.PortalLandlordLeasesPage} />} />

            <Route path="/admin/analytics" element={<MP Comp={Modules.AdminAnalyticsPage} />} />
            <Route path="/admin/users" element={<MP Comp={Modules.AdminUsersPage} />} />
            <Route path="/admin/roles" element={<MP Comp={Modules.AdminRolesPage} />} />
            <Route path="/admin/tenants" element={<MP Comp={Modules.AdminTenantsPage} />} />
            <Route path="/admin/audit" element={<MP Comp={Modules.AdminAuditPage} />} />
            <Route path="/admin/backup" element={<MP Comp={Modules.AdminBackupPage} />} />
            <Route path="/admin/reports/revenue" element={<MP Comp={Modules.AdminRevenueReportsPage} />} />
            <Route path="/admin/reports/usage" element={<MP Comp={Modules.AdminUsageReportsPage} />} />
            <Route path="/admin/integrations/email" element={<MP Comp={Modules.AdminEmailSettingsPage} />} />
            <Route path="/admin/integrations/sms" element={<MP Comp={Modules.AdminSmsSettingsPage} />} />
            <Route path="/admin/integrations/api-keys" element={<MP Comp={Modules.AdminApiKeysPage} />} />
            <Route path="/admin/integrations/webhooks" element={<MP Comp={Modules.AdminWebhooksPage} />} />
            <Route path="/admin/subscriptions/plans" element={<MP Comp={Modules.AdminPlansPage} />} />
            <Route path="/admin/subscriptions/invoices" element={<MP Comp={Modules.AdminSubInvoicesPage} />} />
            <Route path="/admin/subscriptions/customers" element={<MP Comp={Modules.AdminCustomersPage} />} />

            <Route path="/help/docs" element={<MP Comp={Modules.HelpDocsPage} />} />
            <Route path="/help/chat" element={<MP Comp={Modules.HelpChatPage} />} />
            <Route path="/help/training" element={<MP Comp={Modules.HelpTrainingPage} />} />

            <Route path="/reports/leaderboard" element={<MP Comp={Modules.LeaderboardReportPage} />} />
            <Route path="/reports/roi" element={<MP Comp={Modules.RoiReportPage} />} />
            <Route path="/reports/custom" element={<MP Comp={Modules.CustomReportPage} />} />
            <Route path="/reports/my-performance" element={<MP Comp={Modules.MyPerformanceReportPage} />} />
            <Route path="/reports/my-commission" element={<MP Comp={Modules.MyCommissionReportPage} />} />
            <Route path="/reports/portfolio" element={<MP Comp={Modules.PortfolioReportsPage} />} />
            <Route path="/reports/occupancy" element={<MP Comp={Modules.OccupancyReportsPage} />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
