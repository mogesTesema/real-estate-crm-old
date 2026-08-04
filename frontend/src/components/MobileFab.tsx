import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { SALES_ROLES, type RoleKey } from "../lib/roles";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * Mobile primary actions (Phase 1 acceptance: bottom actions for capture/log).
 * Floating action button on small screens — opens quick-create targets.
 */
export function MobileFab() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const role = (me?.role ?? "agent") as RoleKey;
  if (!SALES_ROLES.includes(role)) return null;
  // Don't cover sheet/dialog-heavy pages awkwardly — still fine on lists.
  if (location.pathname.startsWith("/settings")) return null;

  return (
    <div className="fixed bottom-5 right-5 z-30 lg:hidden">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="size-14 rounded-full shadow-lg" aria-label="Quick create">
            <Plus className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
