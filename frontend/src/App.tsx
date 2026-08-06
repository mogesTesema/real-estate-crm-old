import { Suspense, lazy, useEffect } from "react";
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
