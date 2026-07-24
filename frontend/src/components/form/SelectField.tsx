import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export interface Option {
  value: string;
  label: string;
}

/** Thin wrapper over the Radix Select for a plain options list. */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
