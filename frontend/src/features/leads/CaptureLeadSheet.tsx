import { AlertTriangle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { api, apiError } from "../../lib/api";
import { LEAD_SOURCES, LEAD_TYPES, TIMELINES } from "../../lib/constants";
import { useCreate, useList } from "../../lib/hooks";
import { captureLeadSchema, type CaptureLeadValues } from "../../lib/schemas";

function useDuplicateWarning(email: string, phone: string) {
  const [debounced, setDebounced] = useState({ email: "", phone: "" });
  useEffect(() => {
    const t = setTimeout(
      () => setDebounced({ email: email.trim(), phone: phone.trim() }),
      500,
    );
    return () => clearTimeout(t);
  }, [email, phone]);

  return useQuery({
    queryKey: ["dup-preview", debounced.email, debounced.phone],
    enabled: !!(debounced.email || debounced.phone),
    queryFn: async () =>
      (
        await api.get<unknown[]>("/contacts/duplicates/", {
          params: { email: debounced.email, phone: debounced.phone },
        })
      ).data,
  });
}

export function CaptureLeadSheet({
  open,
  onOpenChange,
  onCaptured,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCaptured: () => void;
}) {
  const create = useCreate("leads");
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CaptureLeadValues>({
    resolver: zodResolver(captureLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      lead_type: "buy",
      source: "website",
      budget_max: "",
      preferred_location: "",
      timeline: "1_month",
      notes: "",
    },
  });

  const email = watch("email") ?? "";
  const phone = watch("phone") ?? "";
  const dupes = useDuplicateWarning(email, phone);

  const catalog = useList<{ key: string; label: string; is_active: boolean }>(
    "lead-sources",
    { page_size: 200, is_active: true },
  );

  const sourceOptions = useMemo(() => {
    const fromApi = (catalog.data?.results ?? []).map((s) => ({
      value: s.key,
      label: s.label,
    }));
    if (fromApi.length > 0) return fromApi;
    return LEAD_SOURCES;
  }, [catalog.data]);

  async function onSubmit(values: CaptureLeadValues) {
    try {
      await create.mutateAsync({
        ...values,
        budget_max: values.budget_max ? Number(values.budget_max) : null,
      } as never);
      onCaptured();
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e, "Could not capture lead"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Capture lead</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <SheetBody className="space-y-4">
            <Field label="Full name" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} />
              </Field>
            </div>

            {(dupes.data?.length ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-warning-subtle px-3 py-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  {dupes.data!.length} existing contact
                  {dupes.data!.length > 1 ? "s" : ""} match this email/phone. The lead will
                  be flagged as a possible duplicate.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" required error={errors.lead_type?.message}>
                <Controller
                  control={control}
                  name="lead_type"
                  render={({ field }) => (
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      options={LEAD_TYPES}
                    />
                  )}
                />
              </Field>
              <Field label="Source" error={errors.source?.message}>
                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      options={sourceOptions}
                    />
                  )}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Budget (max)">
                <Input type="number" {...register("budget_max")} />
              </Field>
              <Field label="Timeline">
                <Controller
                  control={control}
                  name="timeline"
                  render={({ field }) => (
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      options={TIMELINES}
                    />
                  )}
                />
              </Field>
            </div>
            <Field label="Preferred location">
              <Input {...register("preferred_location")} />
            </Field>
            <Field label="Notes">
              <Textarea {...register("notes")} />
            </Field>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Capture
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
