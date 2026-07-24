import { type ColumnDef } from "@tanstack/react-table";
import { Contact2, Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { toneClass } from "../../lib/status";
import { useList } from "../../lib/hooks";
import { ContactSheet } from "./ContactSheet";

export interface Contact {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  roles: string[];
  is_vip: boolean;
  tags: string[];
  location_preference: string;
  source: string;
}

export function ContactsPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useList<Contact>("contacts", {
    search: search || undefined,
  });

  const columns = useMemo<ColumnDef<Contact, unknown>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={row.original.full_name || row.original.company_name} />
            <div>
              <div className="flex items-center gap-1 font-medium">
                {row.original.full_name || row.original.company_name || "—"}
                {row.original.is_vip && (
                  <Star className="size-3.5 fill-warning text-warning" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Phone" },
      {
        id: "roles",
        header: "Roles",
        cell: ({ row }) =>
          row.original.roles.length ? (
            <div className="flex flex-wrap gap-1">
              {row.original.roles.map((r) => (
                <Badge key={r} className={toneClass("primary")}>
                  {r}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      { accessorKey: "location_preference", header: "Location" },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Everyone you do business with — buyers, sellers, tenants, landlords."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New contact
          </Button>
        }
      />
      <DataTable
        data={data?.results ?? []}
        columns={columns}
        loading={isLoading}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search contacts…"
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={Contact2}
            title="No contacts yet"
            description="Add a contact or capture a lead to build your database."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" /> New contact
              </Button>
            }
          />
        }
      />

      {creating && (
        <ContactSheet open={creating} onOpenChange={setCreating} />
      )}
      {editing && (
        <ContactSheet
          contact={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}
