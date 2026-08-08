import { Mail, MessageCircle, Pencil, Phone } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "../lib/cn";

export interface RowActionContact {
  phone?: string | null;
  email?: string | null;
}

/**
 * Pinned-right ghost actions for CRM tables (doc 1 §4): Call / Email / WhatsApp / Edit.
 */
export function RowActions({
  contact,
  onEdit,
  className,
}: {
  contact?: RowActionContact;
  onEdit?: () => void;
  className?: string;
}) {
  const phone = contact?.phone?.replace(/\s+/g, "") || "";
  const email = contact?.email || "";
  const wa = phone.replace(/^\+/, "");

  return (
    <div
      className={cn("flex items-center justify-end gap-0.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        disabled={!phone}
        asChild={!!phone}
        aria-label="Call"
        title={phone ? "Call" : "No phone"}
      >
        {phone ? (
          <a href={`tel:${phone}`}>
            <Phone className="size-4" />
          </a>
        ) : (
          <span>
            <Phone className="size-4" />
          </span>
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        disabled={!email}
        asChild={!!email}
        aria-label="Email"
        title={email ? "Email" : "No email"}
      >
        {email ? (
          <a href={`mailto:${email}`}>
            <Mail className="size-4" />
          </a>
        ) : (
          <span>
            <Mail className="size-4" />
          </span>
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        disabled={!wa}
        asChild={!!wa}
        aria-label="WhatsApp"
        title={wa ? "WhatsApp" : "No phone"}
      >
        {wa ? (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" />
          </a>
        ) : (
          <span>
            <MessageCircle className="size-4" />
          </span>
        )}
      </Button>
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={onEdit}
          aria-label="Edit"
          title="Edit"
        >
          <Pencil className="size-4" />
        </Button>
      )}
    </div>
  );
}
