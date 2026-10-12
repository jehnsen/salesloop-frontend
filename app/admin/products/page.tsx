"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Archive, ArchiveRestore, ExternalLink, MoreHorizontal, Pencil, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types";
import { createProduct, getAllProducts, setProductAIApproval, setProductArchived, updateProduct } from "@/services/products";
import { useAsync } from "@/lib/hooks/use-async";
import { categories } from "@/lib/mock-data/categories";
import { formatPeso, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, FilterChips, TableSkeleton } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { ErrorState } from "@/components/shared/states";
import { StockBadge } from "@/components/shared/status-badges";
import { AdminPageHeader } from "@/components/admin/primitives";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImage } from "@/components/site/product-image";

export default function ProductsAdminPage() {
  return (
    <React.Suspense fallback={<TableSkeleton />}>
      <ProductsView />
    </React.Suspense>
  );
}

type Tab = "active" | "archived" | "not_approved";

function ProductsView() {
  const params = useSearchParams();
  const products = useAsync(() => getAllProducts({ includeArchived: true }));
  const [tab, setTab] = React.useState<Tab>("active");
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Product | "new" | null>(null);
  const [archiving, setArchiving] = React.useState<Product | null>(null);
  const focusId = params.get("focus");

  React.useEffect(() => {
    if (focusId && products.data) {
      const p = products.data.find((x) => x.id === focusId);
      if (p) setEditing(p);
    }
  }, [focusId, products.data]);

  const all = products.data ?? [];
  const rows = all.filter((p) => {
    if (tab === "active" && p.archived) return false;
    if (tab === "archived" && !p.archived) return false;
    if (tab === "not_approved" && (p.approvedForAI || p.archived)) return false;
    return !search || p.name.toLowerCase().includes(search.toLowerCase());
  });
  const replace = (updated: Product) => products.setData((list) => list?.map((p) => (p.id === updated.id ? updated : p)));
  const approvedCount = all.filter((p) => p.approvedForAI && !p.archived).length;

  async function toggleAI(p: Product, approved: boolean) {
    replace({ ...p, approvedForAI: approved });
    try {
      replace(await setProductAIApproval(p.id, approved));
      toast.success(approved ? `The AI can now answer questions about ${p.name}` : `The AI will no longer use ${p.name}`);
    } catch {
      replace(p);
      toast.error("Couldn't update AI approval.");
    }
  }

  const actions = (p: Product) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label={`Actions for ${p.name}`}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setEditing(p)}><Pencil /> Edit</DropdownMenuItem>
        {!p.archived && (
          <DropdownMenuItem asChild>
            <Link href={`/products/${p.slug}`} target="_blank"><ExternalLink /> View on store</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {p.archived ? (
          <DropdownMenuItem
            onSelect={async () => {
              replace(await setProductArchived(p.id, false));
              toast.success(`${p.name} restored`);
            }}
          >
            <ArchiveRestore /> Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem destructive onSelect={() => setArchiving(p)}><Archive /> Archive</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Your catalog and the approved information the AI is allowed to use."
        actions={<Button onClick={() => setEditing("new")}><Plus aria-hidden /> Add product</Button>}
      />

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <ShieldCheck className="size-5 shrink-0 text-leaf" aria-hidden />
        <p className="flex-1 text-sm">
          <strong>{approvedCount}</strong> of {all.filter((p) => !p.archived).length} active products are approved for AI responses. The assistant
          refuses to answer about unapproved products and hands the question to you.
        </p>
      </Card>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products" label="Search products" className="md:w-72" />
        <FilterChips
          label="Product list"
          value={tab}
          onChange={setTab}
          options={[
            { id: "active", label: "Active", count: all.filter((p) => !p.archived).length },
            { id: "not_approved", label: "Not approved for AI", count: all.filter((p) => !p.archived && !p.approvedForAI).length },
            { id: "archived", label: "Archived", count: all.filter((p) => p.archived).length },
          ]}
        />
      </div>

      {products.error ? (
        <ErrorState action={<Button onClick={() => products.reload()}>Retry</Button>} />
      ) : (
        <DataTable
          loading={products.loading}
          rows={rows}
          rowKey={(p) => p.id}
          caption="Products"
          empty={{ title: "No products here", description: tab === "archived" ? "Archived products will appear here." : "Try a different search." }}
          columns={[
            {
              key: "product",
              header: "Product",
              cell: (p) => (
                <button type="button" onClick={() => setEditing(p)} className="flex items-center gap-3 text-left">
                  <div className="w-11 shrink-0 overflow-hidden rounded-lg border"><ProductImage src={p.images?.[0]} visual={p.visual} tone={p.tone} name={p.name} /></div>
                  <div>
                    <p className="font-medium hover:underline">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.unit}</p>
                  </div>
                </button>
              ),
            },
            { key: "category", header: "Category", cell: (p) => categories.find((c) => c.slug === p.category)?.shortName },
            { key: "price", header: "Price", cell: (p) => formatPeso(p.price), className: "tabular-nums" },
            { key: "stock", header: "Availability", cell: (p) => <div className="space-y-0.5"><StockBadge status={p.stockStatus} /><p className="text-xs text-muted-foreground">{p.stockQuantity} on hand</p></div> },
            {
              key: "ai",
              header: "Approved for AI",
              cell: (p) => (
                <Switch checked={p.approvedForAI} disabled={p.archived} onCheckedChange={(c) => toggleAI(p, c)} aria-label={`Approve ${p.name} for AI responses`} />
              ),
            },
            { key: "updated", header: "Updated", cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{timeAgo(p.updatedAt)}</span> },
            { key: "actions", header: <span className="sr-only">Actions</span>, cell: actions, className: "w-10" },
          ]}
          mobileCard={(p) => (
            <div className="flex gap-3 rounded-xl border bg-card p-3 shadow-soft">
              <button type="button" onClick={() => setEditing(p)} className="w-16 shrink-0 overflow-hidden rounded-lg border" aria-label={`Edit ${p.name}`}>
                <ProductImage src={p.images?.[0]} visual={p.visual} tone={p.tone} name={p.name} />
              </button>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{p.name}</p>
                  {actions(p)}
                </div>
                <p className="text-sm">{formatPeso(p.price)} · <StockBadge status={p.stockStatus} /></p>
                <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  Approved for AI
                  <Switch checked={p.approvedForAI} disabled={p.archived} onCheckedChange={(c) => toggleAI(p, c)} />
                </label>
              </div>
            </div>
          )}
        />
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="max-w-xl p-0">
          <SheetHeader>
            <SheetTitle>{editing === "new" ? "Add product" : `Edit ${editing?.name ?? ""}`}</SheetTitle>
            <SheetDescription>Only include information from the official label. No health claims.</SheetDescription>
          </SheetHeader>
          {editing !== null && (
            <ProductForm
              key={editing === "new" ? "new" : editing.id}
              product={editing === "new" ? undefined : editing}
              onCancel={() => setEditing(null)}
              onSubmit={async (input) => {
                try {
                  if (editing === "new") {
                    const created = await createProduct(input);
                    products.setData((list) => [created, ...(list ?? [])]);
                    toast.success(`${created.name} added`);
                  } else {
                    replace(await updateProduct(editing.id, input));
                    toast.success("Changes saved");
                  }
                  setEditing(null);
                } catch {
                  toast.error("Couldn't save the product.");
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={`Archive ${archiving?.name}?`}
        description="It will be hidden from the store and the AI assistant. You can restore it anytime."
        confirmLabel="Archive"
        destructive
        onConfirm={async () => {
          if (!archiving) return;
          replace(await setProductArchived(archiving.id, true));
          toast.success(`${archiving.name} archived`);
        }}
      />
    </>
  );
}
