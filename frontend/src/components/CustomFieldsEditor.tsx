import { useList } from "../lib/hooks";
import { Field } from "./form/Field";
import { Input } from "./ui/input";
import { SelectField } from "./form/SelectField";

interface FieldDef {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options: string[];
  required: boolean;
}

/**
 * Renders tenant custom fields for a target model (plan CON-03 / PROP-03).
 * Values live in the parent form's `custom_fields` record.
 */
export function CustomFieldsEditor({
  targetModel,
  values,
  onChange,
}: {
  targetModel: string;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const { data } = useList<FieldDef>("field-definitions", {
    target_model: targetModel,
  });
  const defs = data?.results ?? [];
  if (defs.length === 0) return null;

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium">Custom fields</p>
      {defs.map((d) => {
        const v = values[d.key];
        if (d.field_type === "boolean") {
          return (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(v)}
                onChange={(e) => onChange({ ...values, [d.key]: e.target.checked })}
                className="size-4 accent-[hsl(var(--primary))]"
              />
              {d.label}
              {d.required && <span className="text-destructive">*</span>}
            </label>
          );
        }
        if (d.field_type === "select" && d.options?.length) {
          return (
            <Field key={d.id} label={d.label} required={d.required}>
              <SelectField
                value={String(v ?? "")}
                onChange={(nv) => onChange({ ...values, [d.key]: nv })}
                options={d.options.map((o) => ({ value: o, label: o }))}
              />
            </Field>
          );
        }
        return (
          <Field key={d.id} label={d.label} required={d.required}>
            <Input
              type={d.field_type === "number" ? "number" : d.field_type === "date" ? "date" : "text"}
              value={v == null ? "" : String(v)}
              onChange={(e) =>
                onChange({
                  ...values,
                  [d.key]:
                    d.field_type === "number"
                      ? e.target.value === ""
                        ? null
                        : Number(e.target.value)
                      : e.target.value,
                })
              }
            />
          </Field>
        );
      })}
    </div>
  );
}
