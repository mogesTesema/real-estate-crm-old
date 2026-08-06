import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "../../components/form/Field";
import { SelectField } from "../../components/form/SelectField";
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
import { useCreate, useList } from "../../lib/hooks";
import { createDealSchema, type CreateDealValues } from "../../lib/schemas";
import { type Pipeline } from "./PipelinePage";

interface ContactOption {
  id: string;
  full_name: string;
  company_name: string;
}
interface PropertyOption {
  id: string;
  title: string;
  city: string;
}

export function CreateDealSheet({
  open,
  onOpenChange,
  defaultPipelineId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultPipelineId?: string;
}) {
  const contacts = useList<ContactOption>("contacts", { page_size: 200 });
  const properties = useList<PropertyOption>("properties", {
    node_type: "property",
    page_size: 200,
  });
  const pipelines = useList<Pipeline>("pipelines");
  const create = useCreate("opportunities");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateDealValues>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      title: "",
      contact: "",
      property: "",
      pipeline: defaultPipelineId ?? "",
      stage: "",
      value: "",
      probability: "10",
      expected_close: "",
    },
  });

  const pipelineId = watch("pipeline");
  const pipeline = useMemo(
    () =>
      (pipelines.data?.results ?? []).find((p) => p.id === pipelineId) ??
      (pipelines.data?.results ?? []).find((p) => p.is_default),
    [pipelines.data, pipelineId],
  );

  const stageOptions = useMemo(
    () =>
      [...(pipeline?.stages ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ value: s.id, label: s.name })),
    [pipeline],
  );

  async function onSubmit(values: CreateDealValues) {
    try {
      await create.mutateAsync({
        title: values.title.trim(),
        contact: values.contact,
        property: values.property || null,
        pipeline: values.pipeline || pipeline!.id,
        stage: values.stage,
        value: values.value ? Number(values.value) : 0,
        probability: Number(values.probability || 0),
        expected_close: values.expected_close || null,
      } as never);
      toast.success("Deal created");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e, "Could not create deal"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New deal</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <SheetBody className="space-y-4">
            <Field label="Deal title" required error={errors.title?.message}>
              <Input
                placeholder="e.g. 2BR Bole apartment — Alemayehu"
                {...register("title")}
              />
            </Field>
            <Field label="Contact" required error={errors.contact?.message}>
              <Controller
                control={control}
                name="contact"
                render={({ field }) => (
                  <SelectField
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Pick a contact"
                    options={(contacts.data?.results ?? []).map((c) => ({
                      value: c.id,
                      label: c.full_name || c.company_name,
                    }))}
                  />
                )}
              />
            </Field>
            <Field label="Property (optional)">
              <Controller
                control={control}
                name="property"
                render={({ field }) => (
                  <SelectField
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Link a property"
                    options={(properties.data?.results ?? []).map((p) => ({
                      value: p.id,
                      label: `${p.title}${p.city ? ` · ${p.city}` : ""}`,
                    }))}
                  />
                )}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pipeline" required error={errors.pipeline?.message}>
                <Controller
                  control={control}
                  name="pipeline"
                  render={({ field }) => (
                    <SelectField
                      value={field.value || pipeline?.id}
                      onChange={(v) => {
                        field.onChange(v);
                        setValue("stage", "");
                      }}
                      placeholder="Pipeline"
                      options={(pipelines.data?.results ?? []).map((p) => ({
                        value: p.id,
                        label: p.name,
                      }))}
                    />
                  )}
                />
              </Field>
              <Field label="Starting stage" required error={errors.stage?.message}>
                <Controller
                  control={control}
                  name="stage"
                  render={({ field }) => (
                    <SelectField
                      value={field.value || undefined}
                      onChange={field.onChange}
                      placeholder="Stage"
                      options={stageOptions}
                    />
                  )}
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Value">
                <Input type="number" {...register("value")} />
              </Field>
              <Field label="Probability %">
                <Input type="number" min={0} max={100} {...register("probability")} />
              </Field>
              <Field label="Expected close">
                <Input type="date" {...register("expected_close")} />
              </Field>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create deal
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
