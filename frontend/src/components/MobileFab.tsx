import { Phone, Plus, Upload, Users } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { SALES_ROLES, type RoleKey } from "../lib/roles";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * Mobile primary actions (doc 1 §6): FAB + bottom sheet for quick create and
 * context actions (call / upload) on list and detail surfaces.
 */
export function MobileFab() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const role = (me?.role ?? "agent") as RoleKey;
  if (!SALES_ROLES.includes(role)) return null;
  if (location.pathname.startsWith("/settings")) return null;

  const onProperty = location.pathname.startsWith("/properties/");
  const onContacts = location.pathname.startsWith("/contacts");
  const onLeads = location.pathname.startsWith("/leads");

  return (
    <div className="fixed bottom-5 right-5 z-30 lg:hidden">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="size-14 rounded-full shadow-lg" aria-label="Quick create">
            <Plus className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2 w-52">
          <DropdownMenuItem
            onClick={() => {
              navigate("/leads?new=1");
              setOpen(false);
            }}
          >
            <Users className="size-4" /> Capture lead
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigate("/contacts?new=1");
              setOpen(false);
            }}
          >
            New contact
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigate("/properties?new=1");
              setOpen(false);
            }}
          >
            Add property
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigate("/pipeline?new=1");
              setOpen(false);
            }}
          >
            New deal
          </DropdownMenuItem>
          {(onProperty || onContacts || onLeads) && <DropdownMenuSeparator />}
          {(onContacts || onLeads) && (
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                // Row-level Call uses tel:; here we surface the action sheet entry.
                document.querySelector<HTMLAnchorElement>('a[href^="tel:"]')?.click();
              }}
            >
              <Phone className="size-4" /> Click-to-call
            </DropdownMenuItem>
          )}
          {onProperty && (
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
              }}
            >
              <Upload className="size-4" /> Upload photo
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
