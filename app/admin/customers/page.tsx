"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { CustomerStatus, CustomerSummary } from "@/types";
import { getCustomers } from "@/services/customers";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { downloadCsv } from "@/lib/csv";
import { CUSTOMER_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { DataTable, FilterChips } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { ErrorState } from "@/components/shared/states";
import { CustomerStatusBadge, LikelihoodBadge } from "@/components/shared/status-badges";
import { AdminPageHeader } from "@/components/admin/primitives";
import { ReorderWidget } from "@/components/admin/reorder-widget";

function nextReorderLabel(c: CustomerSummary) {
  const p = c.nextReorder;
  if (!p) return "—";
  if (p.daysUntilExpected > 1) return `In ~${p.daysUntilExpected} days`;
  if (p.daysUntilExpected >= -1) return "Around now";
  return `${Math.abs(p.daysUntilExpected)}d overdue`;
}

export default function CustomersPage() {
  const router = useRouter();
  const customers = useAsync(getCustomers);
  const { name } = useProductLookup();
  const [status, setStatus] = React.useState<CustomerStatus | "all">("all");
  const [search, setSearch] = React.useState("");
  useDbChange(() => void customers.reload({ silent: true }));

  const all = customers.data ?? [];
  const rows = all.filter(
    (c) =>
      (status === "all" || c.status === status) &&
      (!search || [c.name, c.mobile, c.location].join(" ").toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Order history, lifetime value, and predicted reorders."
        actions={
          <Button
            variant="outline"
            disabled={!rows.length}
            onClick={() => {
              downloadCsv(
                "customers.csv",
                ["Name", "Mobile", "Location", "Status", "Orders", "Lifetime value", "Last order", "Favorite products"],
                rows.map((c) => [c.name, c.mobile, c.location, CUSTOMER_STATUS_LABEL[c.status], c.lifetimeOrders, c.lifetimeValue, c.lastOrderAt, c.favoriteProducts.map(name).join("; ")]),
              );
              toast.success(`Exported ${rows.length} customers`);
            }}
          >
            <Download aria-hidden /> Export CSV
          </Button>
        }
      />

      <ReorderWidget limit={3} className="mb-6" />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, mobile, location…" label="Search customers" className="lg:w-80" />
        <FilterChips
          label="Customer status"
          value={status}
          onChange={setStatus}
          options={[
            { id: "all", label: "All", count: all.length },
            ...(["vip", "active", "at_risk", "inactive"] as CustomerStatus[]).map((s) => ({
              id: s,
              label: CUSTOMER_STATUS_LABEL[s],
              count: all.filter((c) => c.status === s).length,
            })),
          ]}
        />
      </div>

      {customers.error ? (
        <ErrorState action={<Button onClick={() => customers.reload()}>Retry</Button>} />
      ) : (
        <DataTable
          loading={customers.loading}
          rows={rows}
          rowKey={(c) => c.id}
          caption="Customers"
          onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
          empty={{ title: "No customers found", description: "Try another search or filter." }}
          columns={[
            {
              key: "name",
              header: "Customer",
              cell: (c) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.name} className="size-8" />
                  <div>
                    <p className="font-medium whitespace-nowrap">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.mobile}</p>
                  </div>
                </div>
              ),
            },
            { key: "location", header: "Location", cell: (c) => c.location },
            { key: "status", header: "Status", cell: (c) => <CustomerStatusBadge status={c.status} /> },
            { key: "orders", header: "Orders", cell: (c) => c.lifetimeOrders, className: "tabular-nums" },
            { key: "ltv", header: "Lifetime value", cell: (c) => formatPeso(c.lifetimeValue), className: "tabular-nums whitespace-nowrap" },
            { key: "last", header: "Last order", cell: (c) => <span className="whitespace-nowrap">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</span> },
            {
              key: "next",
              header: "Likely next reorder",
              cell: (c) => (
                <div className="space-y-1 whitespace-nowrap">
                  <p className="text-sm">{nextReorderLabel(c)}</p>
                  {c.nextReorder && c.nextReorder.likelihood !== "low" && <LikelihoodBadge likelihood={c.nextReorder.likelihood} />}
                </div>
              ),
            },
            { key: "fav", header: "Favorite products", cell: (c) => <span className="line-clamp-2 min-w-40">{c.favoriteProducts.map(name).join(", ")}</span> },
          ]}
          mobileCard={(c) => (
            <Link href={`/admin/customers/${c.id}`} className="block rounded-xl border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.location}</p>
                </div>
                <CustomerStatusBadge status={c.status} />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">Orders</dt><dd className="font-medium">{c.lifetimeOrders}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Value</dt><dd className="font-medium">{formatPeso(c.lifetimeValue)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Next reorder</dt><dd className="font-medium">{nextReorderLabel(c)}</dd></div>
              </dl>
            </Link>
          )}
        />
      )}
    </>
  );
}
