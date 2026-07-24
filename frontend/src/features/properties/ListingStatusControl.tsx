import { useState } from "react";
import { toast } from "sonner";

import { SelectField } from "../../components/form/SelectField";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { apiError } from "../../lib/api";
import { LISTING_STATUSES } from "../../lib/constants";
import { useAction, useList } from "../../lib/hooks";
import { listingStatusTone } from "../../lib/status";

interface Listing {
  id: string;
  status: string;
}

// Status transitions go through the backend state machine (illegal moves are rejected).
export function ListingStatusControl({ propertyId }: { propertyId: string }) {
  const { data } = useList<Listing>("listings", { property: propertyId });
  const listing = data?.results?.[0];
  const transition = useAction("listings");
  const [next, setNext] = useState<string>();

  if (!listing) {
    return (
      <p className="text-sm text-muted-foreground">
        No listing attached to this property yet.
      </p>
    );
  }

  async function apply() {
    if (!next || !listing) return;
    try {
      await transition.mutateAsync({
        id: listing.id,
        action: "transition",
        body: { to_status: next },
      });
      toast.success("Listing status updated");
      setNext(undefined);
    } catch (e) {
      toast.error(apiError(e, "That status change isn't allowed"));
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Current:</span>
        <StatusBadge
          value={listing.status}
          tone={listingStatusTone[listing.status] ?? "muted"}
        />
      </div>
      <div className="flex gap-2">
        <SelectField
          value={next}
          onChange={setNext}
          placeholder="Change status to…"
          options={LISTING_STATUSES.filter((s) => s.value !== listing.status)}
        />
        <Button
          variant="outline"
          onClick={apply}
          disabled={!next || transition.isPending}
        >
          Update
        </Button>
      </div>
    </div>
  );
}
