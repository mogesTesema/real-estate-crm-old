import { type ColumnDef } from "@tanstack/react-table";
import { Contact2, Download, GitMerge, Plus, Star, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { api, apiError } from "../../lib/api";
import { CONTACT_ROLES } from "../../lib/constants";
import { cn } from "../../lib/cn";
import { downloadCsv, downloadXlsx, toCsv } from "../../lib/csv";
import { toneClass } from "../../lib/status";
import { useList } from "../../lib/hooks";
import { ContactDetailSheet } from "./ContactDetailSheet";
import { ContactSheet } from "./ContactSheet";
import { MergeContactsDialog } from "./MergeContactsDialog";

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
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [merging, setMerging] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (params.get("new")) {
      setCreating(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const { data, isLoading } = useList<Contact>("contacts", {
    search: search || undefined,
    is_vip: vipOnly || undefined,
    page_size: 200,
  });

  const rows = useMemo(() => {
    const all = data?.results ?? [];
    if (!roleFilter) return all;
    return all.filter((c) => c.roles.includes(roleFilter));
  }, [data, roleFilter]);

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
                {row.original.is_vip && <Star className="size-3.5 fill-warning text-warning" />}
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
      {
        id: "tags",
        header: "Tags",
        cell: ({ row }) =>
          row.original.tags.length ? (
            <div className="flex flex-wrap gap-1">
              {row.original.tags.map((t) => (
                <Badge key={t} className={toneClass("muted")}>
                  {t}
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

  async function exportCsv() {
    setExporting(true);
    try {
      const { data } = await api.get("/contacts/", { params: { page_size: 500 } });
      const all = (data.results ?? []) as Contact[];
      const rows = [
        ["Full name", "Company", "Email", "Phone", "Roles", "VIP", "Location", "Source"],
        ...all.map((c) => [
          c.full_name,
          c.company_name,
          c.email,
          c.phone,
          c.roles.join("|"),
          c.is_vip ? "yes" : "no",
          c.location_preference,
          c.source,
        ]),
      ];
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`contacts-${stamp}.csv`, toCsv(rows));
      await downloadXlsx(`contacts-${stamp}.xlsx`, "Contacts", rows);
      toast.success(`Exported ${all.length} contacts (CSV + Excel)`);
    } catch (e) {
      toast.error(apiError(e, "Export failed"));
    } finally {
      setExporting(false);
    }
  }

  const viewState = { search, roleFilter, vipOnly };

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Everyone you do business with — buyers, sellers, tenants, landlords."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/contacts/import")}>
              <Upload className="size-4" /> Import
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={exporting}>
              <Download className="size-4" /> Export
            </Button>
            <Button variant="outline" onClick={() => setMerging(true)}>
              <GitMerge className="size-4" /> Merge
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New contact
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setRoleFilter("")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !roleFilter
              ? "border-primary bg-primary-subtle text-primary"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          All
        </button>
        {CONTACT_ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(roleFilter === r.value ? "" : r.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              roleFilter === r.value
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setVipOnly(!vipOnly)}
          className={cn(
            "ml-2 flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            vipOnly
              ? "border-warning bg-warning-subtle text-warning"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <Star className={cn("size-3", vipOnly && "fill-warning")} /> VIP
        </button>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search contacts…"
        onRowClick={setSelected}
        columnToggle
        viewKey="contacts"
        viewState={viewState}
        onApplyView={(s) => {
          setSearch(String(s.search ?? ""));
          setRoleFilter(String(s.roleFilter ?? ""));
          setVipOnly(Boolean(s.vipOnly));
        }}
        empty={
          <EmptyState
            icon={Contact2}
            title="No contacts found"
            description="Add a contact, import a CSV, or capture a lead to build your database."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" /> New contact
              </Button>
            }
          />
        }
      />

      {creating && <ContactSheet open={creating} onOpenChange={setCreating} />}
      {selected && (
        <ContactDetailSheet
          contact={selected}
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
        />
      )}
      <MergeContactsDialog open={merging} onOpenChange={setMerging} />
    </div>
  );
}
