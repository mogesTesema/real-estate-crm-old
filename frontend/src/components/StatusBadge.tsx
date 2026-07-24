import { Badge } from "./ui/badge";
import { cn } from "../lib/cn";
import { type Tone, humanize, toneClass } from "../lib/status";

export function StatusBadge({
  value,
  tone,
  className,
}: {
  value: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <Badge className={cn(toneClass(tone), className)}>{humanize(value)}</Badge>
  );
}
