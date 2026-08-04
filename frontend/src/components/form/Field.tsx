import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";

import { Label } from "../ui/label";

/** Label + control + inline error, for consistent form rows. */
export function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const only = Children.count(children) === 1 ? Children.toArray(children)[0] : null;
  const control =
    only && isValidElement(only)
      ? cloneElement(only as ReactElement<Record<string, unknown>>, {
          id: (only.props as { id?: string }).id ?? id,
          "aria-label":
            (only.props as { "aria-label"?: string })["aria-label"] ?? label,
        })
      : children;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {control}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
