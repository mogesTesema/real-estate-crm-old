import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { useAuth } from "./lib/auth";
import { ContactsPage } from "./features/contacts/ContactsPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { LeadsPage } from "./features/leads/LeadsPage";
import { LoginPage } from "./features/auth/LoginPage";
import { PipelinePage } from "./features/pipeline/PipelinePage";
import { PropertiesPage } from "./features/properties/PropertiesPage";
import { SettingsPage } from "./features/settings/SettingsPage";

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading…
    </div>
  );
}

export function App() {
  const { me, loading, loadMe } = useAuth();

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  if (loading) return <FullPageLoader />;
  if (!me) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
