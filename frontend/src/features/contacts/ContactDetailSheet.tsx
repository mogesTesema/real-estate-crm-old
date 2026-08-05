import { Loader2, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActivityTimeline } from "../../components/ActivityTimeline";
import { Field } from "../../components/form/Field";
import { StatusBadge } from "../../components/StatusBadge";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { apiError } from "../../lib/api";
import { CONTACT_ROLES } from "../../lib/constants";
import { cn } from "../../lib/cn";
import { money } from "../../lib/format";
import { useAction, useDelete, useList, useUpdate } from "../../lib/hooks";
import { humanize, listingStatusTone, opportunityStatusTone, toneClass } from "../../lib/status";
import { type Contact } from "./ContactsPage";

interface Opp {
  id: string;
  title: string;
  status: string;
  value: string;
  currency: string;
}
interface PropertyRow {
  id: string;
  title: string;
  city: string;
}
interface ListingRow {
  id: string;
  status: string;
  price: string;
  currency: string;
  property: string;
}

/** Tags editor — comma-free chips, Enter adds, × removes. */
function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim().toLowerCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Remove tag ${t}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={tags.length ? "" : "Add tags…"}
        className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/** Related records: open deals + owned properties (SRS §3.2.5 360° profile). */
function Related({ contact }: { contact: Contact }) {
  const opps = useList<Opp>("opportunities", { contact: contact.id });
  const properties = useList<PropertyRow>("properties", { page_size: 500 });
  const listings = useList<ListingRow>("listings", { page_size: 200 });

  const owned = (properties.data?.results ?? []).filter(
    (p) => (p as PropertyRow & { owner?: string }).owner === contact.id,
  );
  const byProperty = new Map((listings.data?.results ?? []).map((l) => [l.property, l]));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-semibold">Deals</h4>
        {(opps.data?.results ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No deals linked to this contact.</p>
        ) : (
          <div className="space-y-2">
            {opps.data!.results.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="truncate font-medium">{o.title}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular">{money(o.value, o.currency)}</span>
                  <StatusBadge value={o.status} tone={opportunityStatusTone[o.status] ?? "muted"} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">Owned properties</h4>
        {owned.length === 0 ? (
          <p className="text-sm text-muted-foreground">No properties linked as owner.</p>
        ) : (
          <div className="space-y-2">
            {owned.map((p) => {
              const listing = byProperty.get(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.city}</p>
                  </div>
                  {listing && (
                    <StatusBadge
                      value={listing.status}
                      tone={listingStatusTone[listing.status] ?? "muted"}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
}: {
  contact: Contact;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [form, setForm] = useState({
    full_name: contact.full_name,
    company_name: contact.company_name,
    email: contact.email,
    phone: contact.phone,
    location_preference: contact.location_preference,
    is_vip: contact.is_vip,
  });
  const [roles, setRoles] = useState<string[]>(contact.roles);
  const [tags, setTags] = useState<string[]>(contact.tags);

  const update = useUpdate("contacts");
  const del = useDelete("contacts");
  const addRole = useAction("contacts");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    try {
      await update.mutateAsync({ id: contact.id, ...form, tags } as never);
      toast.success("Contact updated");
    } catch (e) {
      toast.error(apiError(e, "Could not save contact"));
    }
  }

  async function toggleRole(role: string) {
    const active = !roles.includes(role);
    setRoles((r) => (active ? [...r, role] : r.filter((x) => x !== role)));
    try {
      await addRole.mutateAsync({
        id: contact.id,
        action: "roles",
        body: { role, is_active: active },
      });
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  async function remove() {
    try {
      await del.mutateAsync(contact.id);
      toast.success("Contact deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3 pr-6">
            <Avatar name={contact.full_name || contact.company_name} className="size-10" />
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-1.5">
                <span className="truncate">{contact.full_name || contact.company_name}</span>
                {contact.is_vip && <Star className="size-4 shrink-0 fill-warning text-warning" />}
              </SheetTitle>
              <div className="mt-1 flex flex-wrap gap-1">
                {roles.map((r) => (
                  <Badge key={r} className={toneClass("primary")}>
                    {humanize(r)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetHeader>
        <SheetBody>
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
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
                          ? "border-primary bg-primary-subtle text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Tags">
                <TagsInput tags={tags} onChange={setTags} />
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
            </TabsContent>

            <TabsContent value="timeline">
              <ActivityTimeline objectId={contact.id} />
            </TabsContent>

            <TabsContent value="related">
              <Related contact={contact} />
            </TabsContent>

            <TabsContent value="docs">
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
                <p className="text-sm font-medium">Documents in Phase 2</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload, templates, and e-sign land with the Documents module.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </SheetBody>
        <SheetFooter>
          <Button
            variant="ghost"
            className="mr-auto text-destructive"
            onClick={remove}
            disabled={del.isPending}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
