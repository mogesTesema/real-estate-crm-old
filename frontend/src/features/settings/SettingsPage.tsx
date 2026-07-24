import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "../../components/form/Field";
import { SelectField } from "../../components/form/SelectField";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { apiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { humanize } from "../../lib/status";
import { useCreate, useDelete, useList } from "../../lib/hooks";

interface FieldDef {
  id: string;
  target_model: string;
  key: string;
  label: string;
  field_type: string;
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
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add field
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Profile() {
  const { me } = useAuth();
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{me?.full_name || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{me?.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">{me?.role ? humanize(me.role) : "—"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Configure your workspace." />
      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">Custom fields</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="fields" className="mt-4">
          <CustomFields />
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <Profile />
        </TabsContent>
      </Tabs>
    </div>
  );
}
