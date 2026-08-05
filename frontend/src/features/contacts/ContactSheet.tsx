import { Loader2, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CustomFieldsEditor } from "../../components/CustomFieldsEditor";
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
import { contactSchema, type ContactValues } from "../../lib/schemas";
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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: contact?.full_name ?? "",
      company_name: contact?.company_name ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      location_preference: contact?.location_preference ?? "",
      is_vip: contact?.is_vip ?? false,
    },
  });
  const [roles, setRoles] = useState<string[]>(contact?.roles ?? []);
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    (contact as Contact & { custom_fields?: Record<string, unknown> })?.custom_fields ?? {},
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const create = useCreate("contacts");
  const update = useUpdate("contacts");
  const del = useDelete("contacts");
  const addRole = useAction("contacts");

  async function onSubmit(values: ContactValues) {
    try {
      if (editing) {
        await update.mutateAsync({
          id: contact!.id,
          ...values,
          custom_fields: customFields,
        } as never);
      } else {
        const created = (await create.mutateAsync({
          ...values,
          custom_fields: customFields,
        } as never)) as { id: string };
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
      setConfirmDelete(false);
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <SheetBody className="space-y-4">
            <Field label="Full name" required error={errors.full_name?.message}>
              <Input {...register("full_name")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} />
              </Field>
              <Field label="Phone">
                <Input {...register("phone")} />
              </Field>
            </div>
            <Field label="Company">
              <Input {...register("company_name")} />
            </Field>
            <Field label="Preferred location">
              <Input {...register("location_preference")} />
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
                        ? "border-primary bg-primary-subtle text-primary"
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
                checked={watch("is_vip")}
                onChange={(e) => setValue("is_vip", e.target.checked)}
                className="size-4 accent-[hsl(var(--primary))]"
              />
              Mark as VIP
            </label>
            <CustomFieldsEditor
              targetModel="contacts.Contact"
              values={customFields}
              onChange={setCustomFields}
            />
          </SheetBody>
          <SheetFooter>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete contact?"
        description="This soft-deletes the contact. Related deals stay linked for audit."
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
        onConfirm={remove}
      />
    </Sheet>
  );
}
