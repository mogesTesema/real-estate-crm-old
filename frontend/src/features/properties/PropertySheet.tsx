import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "../../components/form/Field";
import { SelectField } from "../../components/form/SelectField";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { apiError } from "../../lib/api";
import { LISTING_TYPES, PROPERTY_CATEGORIES } from "../../lib/constants";
import { useCreate, useDelete, useUpdate } from "../../lib/hooks";
import { ListingStatusControl } from "./ListingStatusControl";
import { type Property } from "./PropertiesPage";

export function PropertySheet({
  property,
  open,
  onOpenChange,
}: {
  property?: Property;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const editing = !!property;
  const [form, setForm] = useState({
    title: property?.title ?? "",
    category: property?.category ?? "residential",
    city: property?.city ?? "",
    bedrooms: property?.bedrooms?.toString() ?? "",
    bathrooms: property?.bathrooms?.toString() ?? "",
    area_built: property?.area_built ?? "",
    image_url: property?.custom_fields?.image_url ?? "",
    description: "",
  });
  const [listingType, setListingType] = useState("sale");
  const [price, setPrice] = useState("");

  const create = useCreate("properties");
  const update = useUpdate("properties");
  const createListing = useCreate("listings");
  const del = useDelete("properties");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function payload() {
    return {
      title: form.title,
      category: form.category,
      city: form.city,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      area_built: form.area_built || null,
      description: form.description,
      custom_fields: { image_url: form.image_url },
    };
  }

  async function save() {
    try {
      if (editing) {
        await update.mutateAsync({ id: property!.id, ...payload() } as never);
      } else {
        const p = (await create.mutateAsync(payload() as never)) as { id: string };
        if (price) {
          await createListing.mutateAsync({
            property: p.id,
            listing_type: listingType,
            price: Number(price),
          } as never);
        }
      }
      toast.success(editing ? "Property updated" : "Property added");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e, "Could not save property"));
    }
  }

  async function remove() {
    try {
      await del.mutateAsync(property!.id);
      toast.success("Property deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? "Edit property" : "Add property"}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          {form.image_url && (
            <img
              src={form.image_url}
              alt=""
              className="h-36 w-full rounded-md object-cover"
            />
          )}
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Image URL">
            <Input
              placeholder="https://…"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <SelectField
                value={form.category}
                onChange={(v) => set("category", v)}
                options={PROPERTY_CATEGORIES}
              />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Beds">
              <Input
                type="number"
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
              />
            </Field>
            <Field label="Baths">
              <Input
                type="number"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
              />
            </Field>
            <Field label="Area">
              <Input
                value={form.area_built}
                onChange={(e) => set("area_built", e.target.value)}
              />
            </Field>
          </div>
          {!editing && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
              <Field label="List as">
                <SelectField
                  value={listingType}
                  onChange={setListingType}
                  options={LISTING_TYPES}
                />
              </Field>
              <Field label="Asking price">
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
            </div>
          )}
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          {editing && (
            <div className="rounded-md border border-border p-3">
              <div className="mb-2 text-sm font-medium">Listing status</div>
              <ListingStatusControl propertyId={property!.id} />
            </div>
          )}
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
