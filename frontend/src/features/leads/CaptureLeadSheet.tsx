import { Loader2 } from "lucide-react";
import { useState } from "react";

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
import { LEAD_SOURCES, LEAD_TYPES, TIMELINES } from "../../lib/constants";
import { useCreate } from "../../lib/hooks";
import { toast } from "sonner";

interface Form {
  name: string;
  email: string;
  phone: string;
  lead_type: string;
  source: string;
  budget_max: string;
  preferred_location: string;
  timeline: string;
  notes: string;
}

const empty: Form = {
  name: "",
  email: "",
  phone: "",
  lead_type: "buy",
  source: "website",
  budget_max: "",
  preferred_location: "",
  timeline: "1_month",
  notes: "",
};

export function CaptureLeadSheet({
  open,
  onOpenChange,
  onCaptured,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCaptured: () => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  const create = useCreate("leads");

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    try {
      await create.mutateAsync({
        ...form,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
      } as never);
      onCaptured();
      setForm(empty);
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
        <SheetBody className="space-y-4">
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" required>
              <SelectField
                value={form.lead_type}
                onChange={(v) => set("lead_type", v)}
                options={LEAD_TYPES}
              />
            </Field>
            <Field label="Source">
              <SelectField
                value={form.source}
                onChange={(v) => set("source", v)}
                options={LEAD_SOURCES}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget (max)">
              <Input
                type="number"
                value={form.budget_max}
                onChange={(e) => set("budget_max", e.target.value)}
              />
            </Field>
            <Field label="Timeline">
              <SelectField
                value={form.timeline}
                onChange={(v) => set("timeline", v)}
                options={TIMELINES}
              />
            </Field>
          </div>
          <Field label="Preferred location">
            <Input
              value={form.preferred_location}
              onChange={(e) => set("preferred_location", e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Capture
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
