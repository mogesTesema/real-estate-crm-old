import {
  Activity,
  BarChart3,
  Building2,
  Check,
  Database,
  FileText,
  Gauge,
  GitBranch,
  HelpCircle,
  KeyRound,
  Mail,
  MessageSquare,
  Plug,
  Server,
  Settings,
  Shield,
  Target,
  Ticket,
  UserPlus,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ModuleDashboard, Panel } from "../../components/ModuleDashboard";
import { Can } from "../../components/RequireRole";
import { ResourceListPage } from "../../components/ResourceListPage";
import { StatusBadge } from "../../components/StatusBadge";
import { SelectField } from "../../components/form/SelectField";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useDemoMutate, useScopedDemoList } from "../../lib/demo";
import type {
  DemoBackupJob,
  DemoCompanyProfile,
  DemoOrgUnit,
  DemoSecuritySetting,
  DemoSupportTicket,
} from "../../lib/demo";
import { compactMoney, relativeTime } from "../../lib/format";
import { useList } from "../../lib/hooks";
import { ALL_ROLES, ROLE_LABELS, type RoleKey } from "../../lib/roles";
import { humanize, type Tone } from "../../lib/status";
import type { UserRow } from "../dashboard/widgets";

const ROLE_SCOPES: Record<RoleKey, string> = {
  super_admin: "ALL — highest authority",
  owner: "ALL (registered under a manager)",
  manager: "BRANCH / TEAM",
  agent: "OWN",
  property_manager: "MANAGED_PROPERTIES",
  marketing: "MARKETING_ALL",
  finance: "FINANCE_ALL",
  portal: "PORTAL_OWN",
};

const ROLE_TONE: Record<RoleKey, Tone> = {
  super_admin: "primary",
  owner: "success",
  manager: "warning",
  agent: "info",
  property_manager: "under_offer",
  marketing: "reserved",
  finance: "success",
  portal: "muted",
};

const PERMISSION_MATRIX: { capability: string; roles: RoleKey[] }[] = [
  { capability: "Manage users & roles", roles: ["super_admin"] },
  { capability: "Company profile & org structure", roles: ["super_admin"] },
  { capability: "Security, MFA, IP allowlist", roles: ["super_admin"] },
  { capability: "Audit log & GPS track access", roles: ["super_admin"] },
  { capability: "Integrations & API keys", roles: ["super_admin"] },
  { capability: "Backups & disaster recovery", roles: ["super_admin"] },
  { capability: "Support tickets", roles: ["super_admin"] },
];

const TILE: Record<Tone, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  destructive: "bg-destructive-subtle text-destructive",
  info: "bg-info-subtle text-info",
  primary: "bg-primary-subtle text-primary",
  muted: "bg-muted text-muted-foreground",
  under_offer: "bg-under-offer-subtle text-under-offer",
  reserved: "bg-reserved-subtle text-reserved",
};

function ActionTile({
  to,
  label,
  icon: Icon,
  tone,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <Button variant="outline" className="h-auto min-h-[44px] justify-start gap-3 py-3" asChild>
      <Link to={to}>
        <span className={`flex size-9 items-center justify-center rounded-lg ${TILE[tone]}`}>
          <Icon className="size-4" />
        </span>
        <span className="text-left text-sm font-medium">{label}</span>
      </Link>
    </Button>
  );
}

function Meter({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: Tone }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <b className="tabular">{hint}</b>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${
            tone === "success"
              ? "bg-success"
              : tone === "warning"
                ? "bg-warning"
                : tone === "destructive"
                  ? "bg-destructive"
                  : tone === "info"
                    ? "bg-info"
                    : "bg-primary"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function priorityTone(priority: string): Tone {
  if (priority === "high") return "destructive";
  if (priority === "medium") return "warning";
  return "muted";
}

export function AdminAnalyticsPage() {
  const users = useList<UserRow>("users", { page_size: 100 });
  const tickets = useScopedDemoList<DemoSupportTicket>("supportTickets", { page_size: 50 });
  const openTickets = (tickets.data?.results ?? []).filter((t) => t.status !== "resolved").length;
  return (
    <ModuleDashboard
      title="System Analytics"
      description="Company health, usage, and support load."
      stats={[
        { label: "Uptime", value: "99.98%", icon: Server, tone: "success" },
        { label: "Active users", value: users.data?.count ?? users.data?.results?.length ?? 0, icon: Users, tone: "info", loading: users.isLoading },
        { label: "API p95", value: "180ms", icon: Gauge, tone: "primary" },
        { label: "Open tickets", value: openTickets, icon: Ticket, tone: openTickets ? "warning" : "success" },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Usage snapshot">
          <div className="space-y-4">
            <Meter label="Sessions today" value={72} hint="214" tone="info" />
            <Meter label="Error rate" value={4} hint="0.04%" tone="success" />
            <Meter label="Peak concurrency" value={38} hint="38 / 100" tone="primary" />
          </div>
        </Panel>
        <Panel title="Support">
          <p className="text-sm text-muted-foreground">
            {openTickets} tickets need attention. Super Admin is the highest authority for system-level assistance.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="min-h-[44px]" asChild>
              <Link to="/admin/tickets">Open tickets</Link>
            </Button>
            <Button variant="outline" className="min-h-[44px]" asChild>
              <Link to="/admin/reports/usage">Usage reports</Link>
            </Button>
          </div>
        </Panel>
      </div>
    </ModuleDashboard>
  );
}

export function AdminActionsPage() {
  return (
    <ModuleDashboard
      title="Quick Actions"
      description="Governance shortcuts for Super Admin only."
      stats={[
        { label: "Users", value: "Invite / assign", icon: UserPlus, tone: "info" },
        { label: "Security", value: "MFA / IP", icon: Shield, tone: "destructive" },
        { label: "Audit", value: "Review", icon: FileText, tone: "muted" },
        { label: "Backup", value: "Run now", icon: Database, tone: "success" },
      ]}
    >
      <Can roles={["super_admin"]}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionTile to="/admin/users" label="Invite user" icon={UserPlus} tone="info" />
          <ActionTile to="/admin/roles" label="Assign role" icon={Shield} tone="primary" />
          <ActionTile to="/admin/audit" label="Open audit log" icon={FileText} tone="muted" />
          <ActionTile to="/admin/backup" label="Run backup" icon={Database} tone="success" />
          <ActionTile to="/admin/company" label="Company profile" icon={Building2} tone="warning" />
          <ActionTile to="/admin/settings" label="Security settings" icon={Settings} tone="destructive" />
        </div>
      </Can>
    </ModuleDashboard>
  );
}

export function AdminUsersPage() {
  const users = useList<UserRow>("users", { page_size: 100 });
  const [role, setRole] = useState<RoleKey>("agent");
  const rows = users.data?.results;
  const byRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of rows ?? []) map.set(u.role, (map.get(u.role) ?? 0) + 1);
    return map;
  }, [rows]);
  const directory = rows ?? [];

  return (
    <ModuleDashboard
      title="All Users"
      description="Create, deactivate, and assign roles. Super Admin can override branch/owner registration."
      stats={[
        { label: "Users", value: directory.length, icon: Users, tone: "info", loading: users.isLoading },
        { label: "Agents", value: byRole.get("agent") ?? 0, icon: Target, tone: "primary" },
        { label: "Managers", value: byRole.get("manager") ?? 0, icon: Shield, tone: "warning" },
        { label: "Portal", value: byRole.get("portal") ?? 0, icon: Users, tone: "muted" },
      ]}
      actions={
        <Can roles={["super_admin"]}>
          <div className="flex flex-wrap items-center gap-2">
            <SelectField
              value={role}
              onChange={(v) => setRole(v as RoleKey)}
              options={ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              className="w-48 min-h-[44px]"
            />
            <Button
              className="min-h-[44px]"
              onClick={() => toast.success(`Invite queued as ${ROLE_LABELS[role]} (demo).`)}
            >
              Invite user
            </Button>
          </div>
        </Can>
      }
    >
      <Panel title="Company directory" loading={users.isLoading}>
        <div className="divide-y divide-border">
          {directory.map((u) => {
            const r = u.role as RoleKey;
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TILE[ROLE_TONE[r] ?? "muted"]}`}>
                    <Users className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.full_name || u.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={ROLE_LABELS[r] ?? u.role} tone={ROLE_TONE[r] ?? "muted"} />
                  <Can roles={["super_admin"]}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => toast.success(`Role override saved for ${u.email} (demo).`)}
                    >
                      Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] text-destructive hover:bg-destructive-subtle"
                      onClick={() => toast.success(`${u.email} deactivated (demo).`)}
                    >
                      Deactivate
                    </Button>
                  </Can>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminRolesPage() {
  return (
    <ModuleDashboard
      title="Roles & Permissions"
      description="System roles, data scopes, and field/record access. Super Admin cannot be locked out."
      stats={[
        { label: "Roles", value: ALL_ROLES.length, icon: Shield, tone: "info" },
        { label: "Highest authority", value: "Super Admin", icon: Shield, tone: "primary" },
        { label: "Custom roles", value: 0, icon: Users, tone: "muted" },
        { label: "SSO", value: "Ready", icon: Plug, tone: "success" },
      ]}
      actions={
        <Can roles={["super_admin"]}>
          <Button
            className="min-h-[44px]"
            onClick={() => toast.success("Permission matrix saved (demo). Super Admin remains highest authority.")}
          >
            Save matrix
          </Button>
        </Can>
      }
    >
      <Panel title="Role catalogue">
        <ul className="space-y-2">
          {ALL_ROLES.map((r) => (
            <li key={r} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-sm">
              <StatusBadge value={ROLE_LABELS[r]} tone={ROLE_TONE[r]} />
              <span className="text-muted-foreground">{ROLE_SCOPES[r]}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Capability matrix">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Capability</th>
                {ALL_ROLES.map((r) => (
                  <th key={r} className="px-1 py-2 text-center">{ROLE_LABELS[r].split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.capability} className="border-t border-border">
                  <td className="py-2.5 pr-3">{row.capability}</td>
                  {ALL_ROLES.map((r) => (
                    <td key={r} className="px-1 py-2.5 text-center">
                      {row.roles.includes(r) ? (
                        <span className="inline-flex size-7 items-center justify-center rounded-full bg-success-subtle text-success">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminCompanyPage() {
  const list = useScopedDemoList<DemoCompanyProfile>("companyProfile", { page_size: 1 });
  const mutate = useDemoMutate("companyProfile");
  const company = list.data?.results[0];
  const [draft, setDraft] = useState<Partial<DemoCompanyProfile>>({});
  const value = { ...company, ...draft };

  return (
    <ModuleDashboard
      title="Company Profile"
      description="Legal details, branding, and localization defaults for this one company."
      stats={[
        { label: "Company", value: company?.name ?? "—", icon: Building2, tone: "primary" },
        { label: "Currency", value: company?.default_currency ?? "—", icon: BarChart3, tone: "info" },
        { label: "Timezone", value: company?.timezone ?? "—", icon: Gauge, tone: "muted" },
        { label: "FX mode", value: humanize(company?.fx_mode ?? "—"), icon: Settings, tone: "success" },
      ]}
      actions={
        <Can roles={["super_admin"]}>
          <Button
            className="min-h-[44px]"
            onClick={() => {
              if (!company) return;
              mutate.patch(company.id, draft);
              toast.success("Company profile saved (demo).");
            }}
          >
            Save profile
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Identity">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["name", "Trading name"],
              ["legal_name", "Legal name"],
              ["registration_number", "Registration"],
              ["tax_number", "Tax number"],
              ["email", "Email"],
              ["phone", "Phone"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <Input
                  className="min-h-[44px]"
                  value={String(value[key as keyof DemoCompanyProfile] ?? "")}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
        </Panel>
        <Panel title="Localization">
          <div className="grid gap-3">
            <Field label="Country">
              <Input
                className="min-h-[44px]"
                value={String(value.country ?? "")}
                onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
              />
            </Field>
            <Field label="Timezone">
              <Input
                className="min-h-[44px]"
                value={String(value.timezone ?? "")}
                onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}
              />
            </Field>
            <Field label="Default currency">
              <Input
                className="min-h-[44px]"
                value={String(value.default_currency ?? "")}
                onChange={(e) => setDraft((d) => ({ ...d, default_currency: e.target.value }))}
              />
            </Field>
            <Field label="FX mode">
              <SelectField
                value={String(value.fx_mode ?? "SINGLE_CURRENCY")}
                onChange={(v) => setDraft((d) => ({ ...d, fx_mode: v }))}
                options={[
                  { value: "SINGLE_CURRENCY", label: "Single currency" },
                  { value: "MULTI_CURRENCY", label: "Multi currency" },
                ]}
                className="min-h-[44px]"
              />
            </Field>
          </div>
        </Panel>
      </div>
    </ModuleDashboard>
  );
}

export function AdminOrgPage() {
  const units = useScopedDemoList<DemoOrgUnit>("orgUnits", { page_size: 50 });
  const rows = units.data?.results ?? [];
  const branches = rows.filter((u) => u.type === "branch");
  const teams = rows.filter((u) => u.type === "team");
  return (
    <ModuleDashboard
      title="Branches & Teams"
      description="Company → Branch → Team. Managers register owners; owners register agents."
      stats={[
        { label: "Branches", value: branches.length, icon: Building2, tone: "info" },
        { label: "Teams", value: teams.length, icon: GitBranch, tone: "primary" },
        { label: "Members", value: rows.reduce((n, u) => n + u.members, 0), icon: Users, tone: "success" },
        { label: "Inactive", value: rows.filter((u) => u.status !== "active").length, icon: Shield, tone: "muted" },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Branches" loading={units.isLoading}>
          <ul className="divide-y divide-border">
            {branches.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TILE.info}`}>
                    <Building2 className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.manager} · {b.members} members</p>
                  </div>
                </div>
                <StatusBadge value={b.status} tone="success" />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Teams" loading={units.isLoading}>
          <ul className="divide-y divide-border">
            {teams.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TILE.primary}`}>
                    <GitBranch className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.parent} · {t.manager}</p>
                  </div>
                </div>
                <StatusBadge value={t.status} tone="success" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </ModuleDashboard>
  );
}

export function AdminSettingsPage() {
  const settings = useScopedDemoList<DemoSecuritySetting>("securitySettings", { page_size: 20 });
  const mutate = useDemoMutate("securitySettings");
  return (
    <ModuleDashboard
      title="System Settings"
      description="Feature toggles, MFA, password policy, and IP allowlist."
      stats={[
        { label: "MFA", value: "Required", icon: Shield, tone: "success" },
        { label: "Password policy", value: "12 chars", icon: KeyRound, tone: "primary" },
        { label: "IP allowlist", value: "On", icon: Plug, tone: "info" },
        { label: "Timeout", value: "30 min", icon: Gauge, tone: "muted" },
      ]}
    >
      <Panel title="Security controls">
        <ul className="divide-y divide-border">
          {(settings.data?.results ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    TILE[s.status === "required" ? "success" : s.status === "disabled" ? "muted" : "info"]
                  }`}
                >
                  <Shield className="size-4" />
                </span>
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground">{s.value}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  value={s.status}
                  tone={s.status === "required" ? "success" : s.status === "disabled" ? "muted" : "info"}
                />
                <Can roles={["super_admin"]}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => {
                      mutate.patch(s.id, {
                        status: s.status === "disabled" ? "enabled" : s.status,
                      });
                      toast.success(`${s.name} updated (demo).`);
                    }}
                  >
                    Edit
                  </Button>
                </Can>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminAuditPage() {
  return (
    <ResourceListPage
      title="Audit Log"
      description="Create, update, delete, exports, GPS track access, and permission changes."
      resource="auditEvents"
      entity="muted"
      icon={FileText}
      statusDomain="audit"
      columns={[
        { key: "actor", header: "Actor" },
        { key: "action", header: "Action", kind: "status", domain: "audit" },
        { key: "entity", header: "Entity" },
        { key: "ip", header: "IP" },
        { key: "at", header: "When", kind: "datetime" },
      ]}
    />
  );
}

export function AdminBackupPage() {
  const backups = useScopedDemoList<DemoBackupJob>("backups", { page_size: 20 });
  const mutate = useDemoMutate("backups");
  const last = backups.data?.results[0];
  const healthy = last?.status === "success";
  return (
    <ModuleDashboard
      title="Data Backup"
      description="Automated backups and disaster recovery for this company."
      stats={[
        { label: "Last backup", value: last ? relativeTime(last.finished_at) : "—", icon: Database, tone: healthy ? "success" : "warning" },
        { label: "Retention", value: "30 days", icon: FileText, tone: "info" },
        { label: "RPO", value: "15 min", icon: Target, tone: "primary" },
        { label: "Status", value: healthy ? "Healthy" : "Check", icon: Server, tone: healthy ? "success" : "warning" },
      ]}
      actions={
        <Can roles={["super_admin"]}>
          <Button
            className="min-h-[44px]"
            onClick={() => {
              const now = new Date().toISOString();
              mutate.upsert({
                id: `bak-${Date.now()}`,
                type: "Manual",
                started_at: now,
                finished_at: now,
                size: "12 MB",
                status: "success",
              });
              toast.success("Backup completed (demo).");
            }}
          >
            Run backup
          </Button>
        </Can>
      }
    >
      <Panel title="Backup history" loading={backups.isLoading}>
        <div className="divide-y divide-border">
          {(backups.data?.results ?? []).map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{row.type}</p>
                <p className="text-xs text-muted-foreground">
                  {relativeTime(row.started_at)} · {row.size}
                </p>
              </div>
              <StatusBadge
                value={row.status}
                tone={row.status === "success" ? "success" : row.status === "failed" ? "destructive" : "info"}
              />
            </div>
          ))}
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminReportsPage() {
  const users = useList<UserRow>("users", { page_size: 100 });
  return (
    <ModuleDashboard
      title="System Reports"
      description="Company-wide health and activity snapshots (read-only)."
      stats={[
        { label: "Users", value: users.data?.count ?? 0, icon: Users, tone: "info" },
        { label: "Uptime", value: "99.98%", icon: Server, tone: "success" },
        { label: "Error rate", value: "0.04%", icon: Activity, tone: "success" },
        { label: "Exports today", value: 3, icon: FileText, tone: "muted" },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <ActionTile to="/admin/reports/revenue" label="Company GCI snapshot" icon={BarChart3} tone="success" />
        <ActionTile to="/admin/reports/usage" label="Usage analytics" icon={Gauge} tone="info" />
        <ActionTile to="/admin/audit" label="Security audit export" icon={FileText} tone="warning" />
      </div>
    </ModuleDashboard>
  );
}

export function AdminRevenueReportsPage() {
  return (
    <ModuleDashboard
      title="Revenue Reports"
      description="Read-only company GCI and closed-deal snapshot. Super Admin does not post money."
      stats={[
        { label: "Closed GCI", value: compactMoney(371000), icon: BarChart3, tone: "success" },
        { label: "Open pipeline", value: compactMoney(1_240_000), icon: Target, tone: "primary" },
        { label: "Won deals", value: 17, icon: Users, tone: "info" },
        { label: "Period", value: "YTD", icon: FileText, tone: "muted" },
      ]}
    >
      <Panel title="Governance note">
        <p className="text-sm text-muted-foreground">
          Figures are platform snapshots for governance. Commission payouts live with Finance — this screen never posts money.
        </p>
        <div className="mt-4 space-y-3">
          <Meter label="GCI vs target" value={74} hint="74%" tone="success" />
          <Meter label="Pipeline coverage" value={62} hint="1.6×" tone="primary" />
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminUsageReportsPage() {
  return (
    <ModuleDashboard
      title="Usage Analytics"
      description="Sessions, API volume, and storage for this company."
      stats={[
        { label: "Sessions (7d)", value: "1,482", icon: Users, tone: "info" },
        { label: "API calls", value: "86k", icon: Activity, tone: "primary" },
        { label: "Storage", value: "12.4 GB", icon: Database, tone: "success" },
        { label: "Error rate", value: "0.04%", icon: Gauge, tone: "success" },
      ]}
    >
      <Panel title="Capacity">
        <div className="space-y-4">
          <Meter label="User seats" value={48} hint="12 / 25" tone="info" />
          <Meter label="Storage" value={31} hint="12.4 / 40 GB" tone="success" />
          <Meter label="API budget" value={43} hint="86k / 200k" tone="primary" />
        </div>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminEmailSettingsPage() {
  return (
    <ModuleDashboard
      title="Email Settings"
      description="Company outbound mail connector."
      stats={[
        { label: "Provider", value: "Mailgun", icon: Mail, tone: "info" },
        { label: "Domain", value: "Verified", icon: Shield, tone: "success" },
        { label: "Daily cap", value: "50k", icon: BarChart3, tone: "primary" },
        { label: "Bounce", value: "0.3%", icon: Target, tone: "warning" },
      ]}
      actions={
        <Can roles={["super_admin"]}>
          <Button className="min-h-[44px]" onClick={() => toast.success("Email connector saved (demo).")}>
            Save connector
          </Button>
        </Can>
      }
    >
      <Panel title="Connection">
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Sending domain</span>
            <StatusBadge value="Verified" tone="success" />
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">SPF / DKIM</span>
            <StatusBadge value="Passing" tone="success" />
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">From address</span>
            <span className="font-medium">noreply@demo.test</span>
          </li>
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminSmsSettingsPage() {
  return (
    <ModuleDashboard
      title="SMS / WhatsApp Settings"
      description="Company messaging connectors."
      stats={[
        { label: "SMS", value: "Twilio", icon: MessageSquare, tone: "info" },
        { label: "WhatsApp", value: "Connected", icon: Shield, tone: "success" },
        { label: "Credits", value: "12,400", icon: BarChart3, tone: "primary" },
        { label: "Opt-outs", value: 18, icon: Users, tone: "muted" },
      ]}
      actions={
        <Can roles={["super_admin"]}>
          <Button className="min-h-[44px]" onClick={() => toast.success("Messaging connector saved (demo).")}>
            Save connector
          </Button>
        </Can>
      }
    >
      <Panel title="Channels">
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">SMS sender</span>
            <StatusBadge value="Active" tone="success" />
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">WhatsApp business</span>
            <StatusBadge value="Connected" tone="success" />
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Quiet hours</span>
            <span className="font-medium">21:00 – 08:00</span>
          </li>
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function AdminApiKeysPage() {
  return (
    <ResourceListPage
      title="API Keys"
      description="Programmatic access for this company."
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
      statusDomain="system"
      columns={[
        { key: "url", header: "URL" },
        { key: "events", header: "Events" },
        { key: "status", header: "Status", kind: "status", domain: "system" },
      ]}
    />
  );
}

export function AdminTicketsPage() {
  const tickets = useScopedDemoList<DemoSupportTicket>("supportTickets", { page_size: 50 });
  const rows = tickets.data?.results ?? [];
  const open = rows.filter((t) => t.status !== "resolved").length;
  return (
    <ModuleDashboard
      title="Support Tickets"
      description="System-level assistance queue."
      stats={[
        { label: "Open", value: open, icon: Ticket, tone: open ? "warning" : "success" },
        { label: "High priority", value: rows.filter((t) => t.priority === "high").length, icon: Shield, tone: "destructive" },
        { label: "In progress", value: rows.filter((t) => t.status === "in_progress").length, icon: Activity, tone: "info" },
        { label: "Resolved", value: rows.filter((t) => t.status === "resolved").length, icon: Check, tone: "success" },
      ]}
    >
      <Panel title="Queue" loading={tickets.isLoading}>
        <ul className="divide-y divide-border">
          {rows.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{t.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.requester} · {relativeTime(t.updated_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={t.priority} tone={priorityTone(t.priority)} />
                <StatusBadge
                  value={t.status}
                  tone={t.status === "resolved" ? "success" : t.status === "open" ? "warning" : "info"}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </ModuleDashboard>
  );
}

export function HelpDocsPage() {
  return (
    <ModuleDashboard
      title="Documentation"
      description="Product guides and API references."
      stats={[
        { label: "Guides", value: 42, icon: HelpCircle, tone: "info" },
        { label: "API refs", value: 18, icon: FileText, tone: "primary" },
        { label: "Videos", value: 12, icon: Video, tone: "success" },
        { label: "Updated", value: "Today", icon: BarChart3, tone: "muted" },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <ActionTile to="/admin/roles" label="Getting started with roles" icon={Shield} tone="primary" />
        <ActionTile to="/admin/settings" label="Security and MFA" icon={Settings} tone="destructive" />
        <ActionTile to="/admin/audit" label="Audit and GPS track access" icon={FileText} tone="info" />
      </div>
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
        { label: "Open tickets", value: 3, icon: Ticket, tone: "warning" },
        { label: "CSAT", value: "4.8", icon: Users, tone: "primary" },
      ]}
    >
      <Panel title="Start a conversation">
        <p className="text-sm text-muted-foreground">
          Chat is staffed for Super Admin governance questions: users, security, backups, and integrations.
        </p>
        <Button className="mt-4 min-h-[44px]" asChild>
          <Link to="/admin/tickets">View ticket queue</Link>
        </Button>
      </Panel>
    </ModuleDashboard>
  );
}

export function HelpTrainingPage() {
  return (
    <ModuleDashboard
      title="Training Videos"
      description="Onboarding clips for Super Admin governance."
      stats={[
        { label: "Videos", value: 12, icon: Video, tone: "success" },
        { label: "Watch time", value: "1h 20m", icon: Gauge, tone: "info" },
        { label: "Completed", value: "3 / 12", icon: Target, tone: "primary" },
        { label: "Updated", value: "This week", icon: FileText, tone: "muted" },
      ]}
    >
      <Panel title="Progress">
        <Meter label="Onboarding series" value={25} hint="3 / 12" tone="primary" />
      </Panel>
    </ModuleDashboard>
  );
}
