import { GitMerge, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { api, apiError } from "../../lib/api";
import { useList } from "../../lib/hooks";
import { type Contact } from "./ContactsPage";

/**
 * Find duplicates and merge them into a survivor (SRS §3.2.7).
 * Type a name/email/phone → matching contacts → pick survivor + duplicate → merge.
 */
export function MergeContactsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [survivor, setSurvivor] = useState<Contact | null>(null);
  const [duplicate, setDuplicate] = useState<Contact | null>(null);
  const [busy, setBusy] = useState(false);

  const { data } = useList<Contact>("contacts", {
    search: query || undefined,
    page_size: 20,
  });
  const rows = data?.results ?? [];

  function pick(c: Contact) {
    if (!survivor) setSurvivor(c);
    else if (c.id !== survivor.id) setDuplicate(c);
  }

  async function merge() {
    if (!survivor || !duplicate) return;
    setBusy(true);
    try {
      await api.post(`/contacts/${survivor.id}/merge/`, { duplicate_id: duplicate.id });
      toast.success(`Merged ${duplicate.full_name || duplicate.email} into ${survivor.full_name}`);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(apiError(e, "Merge failed"));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSurvivor(null);
    setDuplicate(null);
    setQuery("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="size-5" /> Merge duplicate contacts
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name, email, or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {(survivor || duplicate) && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { c: survivor, label: "Survivor (kept)", tone: "border-success bg-success-subtle" },
              { c: duplicate, label: "Duplicate (merged away)", tone: "border-warning bg-warning-subtle" },
            ].map(({ c, label, tone }) => (
              <div key={label} className={`rounded-md border p-3 ${c ? tone : "border-dashed border-border"}`}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {c ? (
                  <p className="mt-1 truncate text-sm font-medium">{c.full_name || c.email}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Pick from results</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {rows.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c)}
              disabled={survivor?.id === c.id || duplicate?.id === c.id}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted disabled:opacity-40"
            >
              <Avatar name={c.full_name || c.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.full_name || "—"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.email} {c.phone && `· ${c.phone}`}
                </p>
              </div>
            </button>
          ))}
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {query ? "No matches." : "Search to find contacts."}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={merge} disabled={!survivor || !duplicate || busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Merge contacts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
