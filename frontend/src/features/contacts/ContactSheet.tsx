import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "../../components/form/Field";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { apiError } from "../../lib/api";
import { CONTACT_ROLES } from "../../lib/constants";
import { cn } from "../../lib/cn";
import { useAction, useCreate, useDelete, useUpdate } from "../../lib/hooks";
import { type Contact } from "./ContactsPage";

export function ContactSheet({
  contact,
  open,
  onOpenChange,
}: {
  contact?: Contact;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const editing = !!contact;
  const [form, setForm] = useState({
    full_name: contact?.full_name ?? "",
    company_name: contact?.company_name ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    location_preference: contact?.location_preference ?? "",
    is_vip: contact?.is_vip ?? false,
  });
  const [roles, setRoles] = useState<string[]>(contact?.roles ?? []);

  const create = useCreate("contacts");
  const update = useUpdate("contacts");
  const del = useDelete("contacts");
  const addRole = useAction("contacts");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    try {
      if (editing) {
        await update.mutateAsync({ id: contact!.id, ...form } as never);
      } else {
        const created = (await create.mutateAsync(form as never)) as { id: string };
        // Attach selected roles to the new contact.
        for (const role of roles) {
          await addRole.mutateAsync({ id: created.id, action: "roles", body: { role } });
        }
      }
      toast.success(editing ? "Contact updated" : "Contact created");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e, "Could not save contact"));
    }
  }

  async function toggleRole(role: string) {
    setRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
    if (editing) {
      try {
        await addRole.mutateAsync({
          id: contact!.id,
          action: "roles",
          body: { role, is_active: !roles.includes(role) },
        });
      } catch (e) {
        toast.error(apiError(e));
      }
    }
  }

  async function remove() {
    try {
      await del.mutateAsync(contact!.id);
      toast.success("Contact deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? "Edit contact" : "New contact"}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <Field label="Full name" required>
            <Input
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
          </div>
          <Field label="Company">
            <Input
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
            />
          </Field>
          <Field label="Preferred location">
            <Input
              value={form.location_preference}
              onChange={(e) => set("location_preference", e.target.value)}
            />
          </Field>
          <Field label="Roles">
            <div className="flex flex-wrap gap-2">
              {CONTACT_ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRole(r.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    roles.includes(r.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_vip}
              onChange={(e) => set("is_vip", e.target.checked)}
              className="size-4 accent-[hsl(var(--primary))]"
            />
            Mark as VIP
          </label>
        </SheetBody>
        <SheetFooter>
          {editing && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive"
              onClick={remove}
              disabled={del.isPending}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={create.isPending || update.isPending}>
            {(create.isPending || update.isPending) && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
