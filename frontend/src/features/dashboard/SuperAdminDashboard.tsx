import {
  Activity,
  Database,
  FileText,
  Gauge,
  MapPin,
  Server,
  Settings,
  Shield,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Can } from "../../components/RequireRole";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useScopedDemoList, type DemoAuditEvent, type DemoBackupJob, type DemoSupportTicket } from "../../lib/demo";
import { relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { ALL_ROLES } from "../../lib/roles";
import { humanize, toneForStatus } from "../../lib/status";
import type { UserRow } from "./widgets";

const QUICK_ACTIONS = [
  { to: "/admin/users", label: "Invite user", icon: UserPlus, tone: "bg-info-subtle text-info" },
  { to: "/admin/roles", label: "Assign role", icon: Shield, tone: "bg-primary-subtle text-primary" },
  { to: "/admin/audit", label: "Open audit log", icon: FileText, tone: "bg-muted text-muted-foreground" },
  { to: "/admin/backup", label: "Run backup", icon: Database, tone: "bg-success-subtle text-success" },
  { to: "/admin/company", label: "Company profile", icon: Settings, tone: "bg-warning-subtle text-warning" },
  { to: "/admin/settings", label: "Security settings", icon: Shield, tone: "bg-destructive-subtle text-destructive" },
] as const;

export function SuperAdminDashboard() {
  const users = useList<UserRow>("users", { page_size: 100 });
  const audit = useScopedDemoList<DemoAuditEvent>("auditEvents", { page_size: 8 });
  const backups = useScopedDemoList<DemoBackupJob>("backups", { page_size: 5 });
  const tickets = useScopedDemoList<DemoSupportTicket>("supportTickets", { page_size: 20 });
  const lastBackup = backups.data?.results?.[0];
  const openTickets = (tickets.data?.results ?? []).filter((t) => t.status !== "resolved").length;
  const gpsViews = (audit.data?.results ?? []).filter((e) => e.action === "GPS_TRACK_VIEW").length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active users"
          value={users.data?.count ?? users.data?.results?.length ?? 0}
          icon={Users}
          tone="info"
          loading={users.isLoading}
        />
        <StatCard label="System roles" value={ALL_ROLES.length} icon={Shield} tone="primary" />
        <StatCard label="System health" value="Healthy" icon={Server} tone="success" hint="All services up" />
        <StatCard
          label="Last backup"
          value={lastBackup ? relativeTime(lastBackup.finished_at) : "—"}
          icon={Database}
          tone={lastBackup?.status === "success" ? "success" : "warning"}
          hint={lastBackup?.type}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" id="quick-actions">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick actions</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/admin/actions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Can roles={["super_admin"]}>
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
            <CardTitle>System analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="size-4 text-success" /> Uptime
              </span>
              <b className="tabular text-success">99.98%</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Activity className="size-4 text-info" /> API p95
              </span>
              <b className="tabular">180ms</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Ticket className="size-4 text-warning" /> Open tickets
              </span>
              <b className="tabular text-warning">{openTickets}</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-primary" /> GPS track views
              </span>
              <b className="tabular">{gpsViews}</b>
            </div>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/admin/analytics">Open analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent audit</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to="/admin/audit">Full log</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {(audit.data?.results ?? []).slice(0, 5).map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.actor}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.entity}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge value={humanize(row.action)} tone={toneForStatus(row.action, "audit")} />
                  <span className="text-xs text-muted-foreground">{relativeTime(row.at)}</span>
                </div>
              </div>
            ))}
            {!audit.isLoading && !(audit.data?.results ?? []).length && (
              <p className="py-6 text-center text-sm text-muted-foreground">No audit events yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
