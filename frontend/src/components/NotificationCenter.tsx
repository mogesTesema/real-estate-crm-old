import { Bell } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { api } from "../lib/api";
import { useList } from "../lib/hooks";
import { relativeTime } from "../lib/format";

interface Notification {
  id: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const notifs = useList<Notification>("notifications", { page_size: 20 });

  const items = notifs.data?.results ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  async function markRead(n: Notification) {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/mark-read/`);
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (n.link) navigate(n.link);
    setOpen(false);
  }

  async function markAll() {
    await api.post("/notifications/mark-all-read/");
    await qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                void markAll();
              }}
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&apos;re caught up.
          </p>
        )}
        {items.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="flex flex-col items-start gap-0.5"
            onClick={() => void markRead(n)}
          >
            <span className={`text-sm ${n.is_read ? "font-normal" : "font-medium"}`}>
              {n.title}
            </span>
            {n.body && (
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
            )}
            <span className="text-xs text-muted-foreground">{relativeTime(n.created_at)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
