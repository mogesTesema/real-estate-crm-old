import { Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Field } from "../../components/form/Field";
import { SelectField } from "../../components/form/SelectField";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { humanize } from "../../lib/status";
import { useCreate, useDelete, useList } from "../../lib/hooks";
import { isAdminRole, ROLE_LABELS, ALL_ROLES, type RoleKey } from "../../lib/roles";

interface FieldDef {
  id: string;
  target_model: string;
  key: string;
  label: string;
  field_type: string;
}
interface OrgNode {
  id: string;
  name: string;
  company?: string;
  branch?: string;
}

const MODELS = [
  { value: "contacts.Contact", label: "Contact" },
  { value: "leads.Lead", label: "Lead" },
  { value: "properties.Property", label: "Property" },
  { value: "deals.Opportunity", label: "Opportunity" },
];
const TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
];

// ---------------------------------------------------------------- Custom fields
function CustomFields() {
  const { data, isLoading } = useList<FieldDef>("field-definitions");
  const create = useCreate("field-definitions");
  const del = useDelete("field-definitions");
  const [form, setForm] = useState({
    target_model: "contacts.Contact",
    key: "",
    label: "",
    field_type: "text",
  });

  async function add() {
    if (!form.key || !form.label) {
      toast.error("Key and label are required");
      return;
    }
    try {
      await create.mutateAsync(form as never);
      toast.success("Custom field added");
      setForm({ ...form, key: "", label: "" });
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Custom fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {(data?.results ?? []).map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{f.label}</span>{" "}
                <span className="text-muted-foreground">
                  · {f.key} · {humanize(f.field_type)} ·{" "}
                  {MODELS.find((m) => m.value === f.target_model)?.label ?? f.target_model}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => del.mutate(f.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {!isLoading && (data?.results?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              No custom fields yet. Add one to extend any record without code.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Applies to">
            <SelectField
              value={form.target_model}
              onChange={(v) => setForm({ ...form, target_model: v })}
              options={MODELS}
            />
          </Field>
          <Field label="Label">
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </Field>
          <Field label="Key">
            <Input
              placeholder="e.g. mortgage_status"
              value={form.key}
              onChange={(e) =>
                setForm({ ...form, key: e.target.value.replace(/\s+/g, "_").toLowerCase() })
              }
            />
          </Field>
          <Field label="Type">
            <SelectField
              value={form.field_type}
              onChange={(v) => setForm({ ...form, field_type: v })}
              options={TYPES}
            />
          </Field>
          <Button onClick={add} disabled={create.isPending} className="w-full">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add field
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ Profile
function Profile() {
  const { me, refreshMe } = useAuth();
  const branches = useList<OrgNode>("branches", { page_size: 100 });
  const teams = useList<OrgNode>("teams", { page_size: 100 });
  const branch = branches.data?.results?.find((b) => b.id === me?.branch);
  const team = teams.data?.results?.find((t) => t.id === me?.team);
  const [name, setName] = useState(me?.full_name ?? "");
  const [busy, setBusy] = useState(false);

  async function saveProfile() {
    setBusy(true);
    try {
      await api.patch("/me/", { full_name: name });
      await refreshMe();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiError(err, "Could not update profile"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button onClick={() => void saveProfile()} disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Save name
        </Button>
        <div className="space-y-2 border-t border-border pt-3">
          {[
            ["Email", me?.email || "—"],
            ["Role", me?.role ? ROLE_LABELS[me.role as RoleKey] ?? humanize(me.role) : "—"],
            ["Branch", branch?.name ?? "—"],
            ["Team", team?.name ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------- Notifications
interface NotifPrefs {
  sla_alerts: boolean;
  new_lead: boolean;
  deal_moves: boolean;
  weekly_digest: boolean;
  quiet_hours: string;
}
const DEFAULT_PREFS: NotifPrefs = {
  sla_alerts: true,
  new_lead: true,
  deal_moves: true,
  weekly_digest: false,
  quiet_hours: "20:00–08:00",
};

function Notifications() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem("notif-prefs") ?? "{}") };
    } catch {
      return DEFAULT_PREFS;
    }
  });

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      localStorage.setItem("notif-prefs", JSON.stringify(next));
      return next;
    });
    toast.success("Preference saved");
  }

  const rows: { key: keyof NotifPrefs; label: string; hint: string }[] = [
    { key: "sla_alerts", label: "SLA breach alerts", hint: "Warn when a lead's first-response SLA is at risk" },
    { key: "new_lead", label: "New lead assigned", hint: "When the routing engine assigns you a lead" },
    { key: "deal_moves", label: "Deal stage changes", hint: "Moves on deals you own" },
    { key: "weekly_digest", label: "Weekly digest", hint: "Summary of pipeline movement every Monday" },
  ];

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <label
            key={r.key}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-border p-3"
          >
            <span>
              <span className="block text-sm font-medium">{r.label}</span>
              <span className="block text-xs text-muted-foreground">{r.hint}</span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(prefs[r.key])}
              onChange={() => toggle(r.key)}
              className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
            />
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          Delivery channels (email / SMS / push) are managed by your administrator and arrive
          with the notifications service (Phase 2). These toggles are stored on this device.
        </p>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------- Organization
function OrgSection({
  title,
  resource,
  parentField,
  parents,
  canWrite,
}: {
  title: string;
  resource: string;
  parentField?: string;
  parents?: { value: string; label: string }[];
  canWrite: boolean;
}) {
  const { data, isLoading } = useList<OrgNode>(resource, { page_size: 100 });
  const create = useCreate(resource);
  const del = useDelete(resource);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");

  async function add() {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({
        name: name.trim(),
        ...(parentField && parent ? { [parentField]: parent } : {}),
      } as never);
      setName("");
      setParent("");
      toast.success(`${title.slice(0, -1)} added`);
    } catch (e) {
      toast.error(apiError(e, "Could not add — admin role required"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {(data?.results ?? []).map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium">{n.name}</span>
              {parentField && parents && (
                <span className="text-muted-foreground">
                  {" "}
                  · {parents.find((p) => p.value === n[parentField as keyof OrgNode])?.label ?? ""}
                </span>
              )}
            </div>
            {canWrite && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => del.mutate(n.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {!isLoading && (data?.results?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">None yet.</p>
        )}
        {canWrite && (
          <div className="flex gap-2 pt-2">
            <Input
              placeholder={`New ${title.toLowerCase().slice(0, -1)} name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {parentField && parents && (
              <SelectField
                value={parent || undefined}
                onChange={setParent}
                options={parents}
                placeholder="Parent"
                className="w-44"
              />
            )}
            <Button onClick={add} disabled={create.isPending || !name.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Organization() {
  const { me } = useAuth();
  const canWrite = isAdminRole(me?.role);
  const companies = useList<OrgNode>("companies", { page_size: 100 });
  const branches = useList<OrgNode>("branches", { page_size: 100 });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <OrgSection title="Companies" resource="companies" canWrite={canWrite} />
      <OrgSection
        title="Branches"
        resource="branches"
        parentField="company"
        parents={(companies.data?.results ?? []).map((c) => ({ value: c.id, label: c.name }))}
        canWrite={canWrite}
      />
      <OrgSection
        title="Teams"
        resource="teams"
        parentField="branch"
        parents={(branches.data?.results ?? []).map((b) => ({ value: b.id, label: b.name }))}
        canWrite={canWrite}
      />
    </div>
  );
}

// ----------------------------------------------------------------- Roles
const PERMISSION_MATRIX: { capability: string; roles: RoleKey[] }[] = [
  { capability: "View & work leads", roles: ["super_admin", "owner", "manager", "agent"] },
  { capability: "Manage contacts & merge", roles: ["super_admin", "owner", "manager", "agent", "property_manager"] },
  { capability: "Manage properties & listings", roles: ["super_admin", "owner", "manager", "agent", "property_manager"] },
  { capability: "Work the pipeline", roles: ["super_admin", "owner", "manager", "agent"] },
  { capability: "Analytics & forecast", roles: ["super_admin", "owner", "manager"] },
  { capability: "Org, custom fields & pipelines", roles: ["super_admin", "owner"] },
  { capability: "Finance & commissions (Phase 3)", roles: ["super_admin", "owner", "finance"] },
  { capability: "Campaigns & portals (Phase 2)", roles: ["super_admin", "owner", "marketing"] },
];

function Roles() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Role permission matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-2 py-2 font-medium">Capability</th>
                {ALL_ROLES.filter((r) => r !== "portal").map((r) => (
                  <th key={r} className="px-2 py-2 text-center text-xs font-medium">
                    {ROLE_LABELS[r].split(" /")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.capability} className="border-b border-border last:border-0">
                  <td className="px-2 py-2">{row.capability}</td>
                  {ALL_ROLES.filter((r) => r !== "portal").map((r) => (
                    <td key={r} className="px-2 py-2 text-center">
                      {row.roles.includes(r) ? (
                        <span className="font-medium text-success">✓</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Enforced server-side via RBAC + row-level scoping: agents see their own records,
          managers their branch, owners the whole company.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- Security
function Security() {
  const { me, refreshMe } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaBusy, setMfaBusy] = useState(false);

  async function changePassword() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await api.patch("/me/", {
        current_password: currentPassword,
        password,
      });
      setCurrentPassword("");
      setPassword("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(apiError(err, "Could not update password"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleMfa() {
    setMfaBusy(true);
    try {
      await api.patch("/me/", { mfa_enabled: !me?.mfa_enabled });
      await refreshMe();
      toast.success(me?.mfa_enabled ? "MFA disabled" : "MFA enabled");
    } catch (err) {
      toast.error(apiError(err, "Could not update MFA"));
    } finally {
      setMfaBusy(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3 rounded-md border border-border p-3">
          <p className="font-medium">Change password</p>
          <Field label="Current password">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Button onClick={() => void changePassword()} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">
              When enabled, sign-in asks for a 6-digit code (stub verifier in Phase 1).
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={mfaBusy} onClick={() => void toggleMfa()}>
            {me?.mfa_enabled ? "Disable" : "Enable"}
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium">Session</p>
            <p className="text-xs text-muted-foreground">
              JWT access token stored locally; refresh via /auth/token/refresh.
            </p>
          </div>
          <StatusBadge value="active" tone="success" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const { me } = useAuth();
  const admin = isAdminRole(me?.role);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "profile";

  function setTab(v: string) {
    setParams(v === "profile" ? {} : { tab: v }, { replace: true });
  }

  return (
    <div>
      <PageHeader title="Settings" description="Configure your workspace." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="fields">Custom fields</TabsTrigger>
          {admin && <TabsTrigger value="org">Organization</TabsTrigger>}
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <Profile />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <Notifications />
        </TabsContent>
        <TabsContent value="fields" className="mt-4">
          <CustomFields />
        </TabsContent>
        {admin && (
          <TabsContent value="org" className="mt-4">
            <Organization />
          </TabsContent>
        )}
        <TabsContent value="roles" className="mt-4">
          <Roles />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <Security />
        </TabsContent>
      </Tabs>
    </div>
  );
}
