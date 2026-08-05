import { Loader2, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CustomFieldsEditor } from "../../components/CustomFieldsEditor";
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
import { api, apiError } from "../../lib/api";
import { LISTING_TYPES, PROPERTY_CATEGORIES } from "../../lib/constants";
import { useCreate, useDelete, useList, useUpdate } from "../../lib/hooks";
import { propertySchema, type PropertyValues } from "../../lib/schemas";
import { cn } from "../../lib/cn";
import { humanize } from "../../lib/status";
import { ListingStatusControl } from "./ListingStatusControl";
import { type Property } from "./PropertiesPage";

const NODE_TYPES = [
  { value: "property", label: "Property / Unit" },
  { value: "building", label: "Building / Phase" },
  { value: "project", label: "Project / Development" },
];

const AMENITY_OPTIONS = [
  "parking",
  "pool",
  "gym",
  "elevator",
  "balcony",
  "garden",
  "security",
  "furnished",
];

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
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PropertyValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title ?? "",
      node_type: (property?.node_type as PropertyValues["node_type"]) ?? "property",
      parent: property?.parent ?? "",
      category: property?.category ?? "residential",
      city: property?.city ?? "",
      address_line: property?.address_line ?? "",
      bedrooms: property?.bedrooms?.toString() ?? "",
      bathrooms: property?.bathrooms?.toString() ?? "",
      area_built: property?.area_built ?? "",
      image_url: property?.custom_fields?.image_url ?? "",
      description: property?.description ?? "",
      listing_type: "sale",
      price: "",
    },
  });
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    (property?.custom_fields as Record<string, unknown>) ?? {},
  );
  const [amenities, setAmenities] = useState<string[]>(property?.amenities ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [publishAfter, setPublishAfter] = useState(false);

  const create = useCreate("properties");
  const update = useUpdate("properties");
  const createListing = useCreate("listings");
  const del = useDelete("properties");
  const parents = useList<Property>("properties", { page_size: 500 });
  const listings = useList<{ id: string; status: string }>("listings", {
    property: property?.id,
    page_size: 5,
  });
  const nodeType = watch("node_type");

  const parentOptions = (parents.data?.results ?? [])
    .filter((p) => p.id !== property?.id)
    .filter((p) =>
      nodeType === "property" ? p.node_type !== "property" : p.node_type === "project",
    )
    .map((p) => ({
      value: p.id,
      label: `${p.title} (${p.node_type.replace("_", " ")})`,
    }));

  async function onSubmit(values: PropertyValues) {
    const payload = {
      title: values.title,
      node_type: values.node_type,
      parent: values.parent || null,
      category: values.category,
      city: values.city,
      address_line: values.address_line,
      bedrooms: values.bedrooms ? Number(values.bedrooms) : null,
      bathrooms: values.bathrooms ? Number(values.bathrooms) : null,
      area_built: values.area_built || null,
      description: values.description,
      amenities,
      custom_fields: { ...customFields, image_url: values.image_url },
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: property!.id, ...payload } as never);
        const draftListing = (listings.data?.results ?? []).find((l) => l.status === "draft");
        if (publishAfter && draftListing) {
          await api.post(`/listings/${draftListing.id}/transition/`, {
            to_status: "active",
            reason: "Published from property editor",
          });
        }
      } else {
        const p = (await create.mutateAsync(payload as never)) as { id: string };
        if (values.price && values.node_type === "property") {
          const listing = (await createListing.mutateAsync({
            property: p.id,
            listing_type: values.listing_type ?? "sale",
            price: Number(values.price),
          } as never)) as { id: string };
          if (publishAfter) {
            await api.post(`/listings/${listing.id}/transition/`, {
              to_status: "active",
              reason: "Published on create",
            });
          }
        }
      }
      toast.success(
        editing
          ? publishAfter
            ? "Property saved & published"
            : "Property updated"
          : publishAfter
            ? "Property added & published"
            : "Property saved as draft",
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e, "Could not save property"));
    }
  }

  async function remove() {
    try {
      await del.mutateAsync(property!.id);
      toast.success("Property deleted");
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
          <SheetTitle>{editing ? "Edit property" : "Add property"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <SheetBody className="space-y-4">
            {watch("image_url") && (
              <img
                src={watch("image_url")}
                alt=""
                className="h-36 w-full rounded-md object-cover"
              />
            )}
            <Field label="Title" required error={errors.title?.message}>
              <Input {...register("title")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Node type">
                <Controller
                  control={control}
                  name="node_type"
                  render={({ field }) => (
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      options={NODE_TYPES}
                    />
                  )}
                />
              </Field>
              {nodeType !== "project" && (
                <Field label="Parent">
                  <Controller
                    control={control}
                    name="parent"
                    render={({ field }) => (
                      <SelectField
                        value={field.value || undefined}
                        onChange={field.onChange}
                        options={parentOptions}
                        placeholder="None"
                      />
                    )}
                  />
                </Field>
              )}
            </div>
            <Field label="Image URL" error={errors.image_url?.message}>
              <Input placeholder="https://…" {...register("image_url")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      options={PROPERTY_CATEGORIES}
                    />
                  )}
                />
              </Field>
              <Field label="City">
                <Input {...register("city")} />
              </Field>
            </div>
            <Field label="Address">
              <Input {...register("address_line")} />
            </Field>
            {nodeType === "property" && (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Beds">
                  <Input type="number" {...register("bedrooms")} />
                </Field>
                <Field label="Baths">
                  <Input type="number" {...register("bathrooms")} />
                </Field>
                <Field label="Area">
                  <Input {...register("area_built")} />
                </Field>
              </div>
            )}
            {!editing && nodeType === "property" && (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                <Field label="List as">
                  <Controller
                    control={control}
                    name="listing_type"
                    render={({ field }) => (
                      <SelectField
                        value={field.value ?? "sale"}
                        onChange={field.onChange}
                        options={LISTING_TYPES}
                      />
                    )}
                  />
                </Field>
                <Field label="Asking price">
                  <Input type="number" {...register("price")} />
                </Field>
              </div>
            )}
            <Field label="Description">
              <Textarea {...register("description")} />
            </Field>
            <Field label="Amenities">
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => {
                  const on = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() =>
                        setAmenities((prev) =>
                          on ? prev.filter((x) => x !== a) : [...prev, a],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        on
                          ? "border-primary bg-primary-subtle text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {humanize(a)}
                    </button>
                  );
                })}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishAfter}
                onChange={(e) => setPublishAfter(e.target.checked)}
                className="size-4 accent-[hsl(var(--primary))]"
              />
              Publish listing (draft → active)
            </label>
            <CustomFieldsEditor
              targetModel="properties.Property"
              values={customFields}
              onChange={setCustomFields}
            />
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
            <Button
              type="submit"
              variant="outline"
              disabled={create.isPending || update.isPending}
              onClick={() => setPublishAfter(false)}
            >
              Save draft
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {publishAfter ? "Save & publish" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete property?"
        description="This soft-deletes the property and its listings from active inventory."
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
        onConfirm={remove}
      />
    </Sheet>
  );
}
