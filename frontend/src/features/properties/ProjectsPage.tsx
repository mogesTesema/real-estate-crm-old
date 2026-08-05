import { Building, Building2, ChevronRight, Layers, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { money } from "../../lib/format";
import { cn } from "../../lib/cn";
import { listingStatusTone } from "../../lib/status";
import { useList } from "../../lib/hooks";
import { type Listing, type Property } from "./PropertiesPage";
import { PropertySheet } from "./PropertySheet";

/**
 * Project → Building/Phase → Unit hierarchy (SRS §3.3.6) rendered as an
 * expandable tree backed by the self-referential Property.parent chain.
 */
interface Node {
  property: Property;
  listing?: Listing;
  children: Node[];
}

function buildTree(rows: Property[], listings: Listing[]): Node[] {
  const byProperty = new Map<string, Listing>();
  for (const l of listings) if (!byProperty.has(l.property)) byProperty.set(l.property, l);
  const nodes = new Map<string, Node>();
  for (const p of rows)
    nodes.set(p.id, { property: p, listing: byProperty.get(p.id), children: [] });
  const roots: Node[] = [];
  for (const n of nodes.values()) {
    if (n.property.parent && nodes.has(n.property.parent)) {
      nodes.get(n.property.parent)!.children.push(n);
    } else {
      roots.push(n);
    }
  }
  return roots;
}

function TreeNode({ node, depth }: { node: Node; depth: number }) {
  const [open, setOpen] = useState(depth === 0);
  const navigate = useNavigate();
  const p = node.property;
  const Icon = p.node_type === "project" ? Layers : p.node_type === "building" ? Building : Building2;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted",
          depth > 0 && "ml-6",
        )}
        style={{ marginLeft: depth > 0 ? depth * 24 : undefined }}
      >
        {node.children.length > 0 ? (
          <button onClick={() => setOpen(!open)} aria-label={open ? "Collapse" : "Expand"}>
            <ChevronRight
              className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Icon
          className={cn(
            "size-4",
            p.node_type === "project"
              ? "text-entity-property"
              : p.node_type === "building"
                ? "text-info"
                : "text-muted-foreground",
          )}
        />
        <button
          onClick={() => navigate(`/properties/${p.id}`)}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-primary"
        >
          {p.title}
        </button>
        <span className="text-xs capitalize text-muted-foreground">
          {p.node_type.replace("_", " ")}
        </span>
        {node.listing && (
          <span className="hidden items-center gap-2 sm:flex">
            <span className="text-sm font-semibold tabular">
              {money(node.listing.price, node.listing.currency)}
            </span>
            <StatusBadge
              value={node.listing.status}
              tone={listingStatusTone[node.listing.status] ?? "muted"}
            />
          </span>
        )}
      </div>
      {open &&
        node.children.map((c) => <TreeNode key={c.property.id} node={c} depth={depth + 1} />)}
    </div>
  );
}

export function ProjectsPage() {
  const [creating, setCreating] = useState(false);
  const props = useList<Property>("properties", { page_size: 500 });
  const listings = useList<Listing>("listings", { page_size: 500 });

  const tree = useMemo(
    () => buildTree(props.data?.results ?? [], listings.data?.results ?? []),
    [props.data, listings.data],
  );

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Developments, buildings/phases, and their units."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add node
          </Button>
        }
      />
      {props.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : tree.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No projects yet"
          description="Create a project, then attach buildings and units as children."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Add project
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card p-2">
          {tree.map((n) => (
            <TreeNode key={n.property.id} node={n} depth={0} />
          ))}
        </div>
      )}
      {creating && <PropertySheet open={creating} onOpenChange={setCreating} />}
    </div>
  );
}
