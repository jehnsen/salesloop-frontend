"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Download, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/types";
import { getOrders, updateOrderDetails, updateOrderStatus } from "@/services/orders";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { downloadCsv } from "@/lib/csv";
import { CHANNEL_LABEL, LEAD_SOURCE_LABEL, ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/constants";
import { cn, formatDateTime, formatPeso, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, FilterChips, TableSkeleton } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { ErrorState } from "@/components/shared/states";
import { AIBadge, OrderStatusBadge } from "@/components/shared/status-badges";
import { AdminPageHeader } from "@/components/admin/primitives";

const FLOW: OrderStatus[] = ORDER_STATUSES.map((s) => s.id).filter((s) => s !== "cancelled");

function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = FLOW.indexOf(s);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
}

export default function OrdersPage() {
  return (
    <React.Suspense fallback={<TableSkeleton />}>
      <OrdersView />
    </React.Suspense>
  );
}

function OrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const orders = useAsync(getOrders);
  const [status, setStatus] = React.useState<OrderStatus | "all" | "open">("all");
  const [search, setSearch] = React.useState("");
  const focusId = params.get("focus");
  useDbChange(() => void orders.reload({ silent: true }));

  const all = orders.data ?? [];
  const selected = all.find((o) => o.id === focusId) ?? null;
  const rows = all.filter((o) => {
    if (status === "open" && ["delivered", "cancelled"].includes(o.status)) return false;
    if (status !== "all" && status !== "open" && o.status !== status) return false;
    return !search || [o.reference, o.customerName, o.deliveryLocation].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  const open = (o: Order | null) => router.replace(o ? `/admin/orders?focus=${o.id}` : "/admin/orders", { scroll: false });
  const replace = (updated: Order) => orders.setData((list) => list?.map((o) => (o.id === updated.id ? updated : o)));

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Inquiries become orders once you confirm availability, total, payment, and delivery."
        actions={
          <Button
            variant="outline"
            disabled={!rows.length}
            onClick={() => {
              downloadCsv(
                "orders.csv",
                ["Reference", "Customer", "Mobile", "Items", "Total", "Location", "Payment", "Status", "AI assisted", "Created"],
                rows.map((o) => [o.reference, o.customerName, o.mobile, o.items.map((i) => `${i.quantity}x ${i.productName}`).join("; "), o.total, o.deliveryLocation, o.paymentMethod, ORDER_STATUS_LABEL[o.status], o.aiAssisted ? "Yes" : "No", o.createdAt]),
              );
              toast.success(`Exported ${rows.length} orders`);
            }}
          >
            <Download aria-hidden /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search reference, customer, location…" label="Search orders" className="md:max-w-sm" />
        <FilterChips
          label="Order status"
          value={status}
          onChange={setStatus}
          options={[
            { id: "all", label: "All", count: all.length },
            { id: "open", label: "Open", count: all.filter((o) => !["delivered", "cancelled"].includes(o.status)).length },
            ...ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label, count: all.filter((o) => o.status === s.id).length })),
          ]}
        />
      </div>

      {orders.error ? (
        <ErrorState action={<Button onClick={() => orders.reload()}>Retry</Button>} />
      ) : (
        <DataTable
          loading={orders.loading}
          rows={rows}
          rowKey={(o) => o.id}
          caption="Orders"
          onRowClick={open}
          empty={{ title: "No orders match", description: "Try another status or search." }}
          columns={[
            {
              key: "ref",
              header: "Order",
              cell: (o) => (
                <div>
                  <p className="font-medium">{o.reference}</p>
                  <p className="text-xs whitespace-nowrap text-muted-foreground">{timeAgo(o.createdAt)}</p>
                </div>
              ),
            },
            { key: "customer", header: "Customer", cell: (o) => <span className="whitespace-nowrap">{o.customerName}</span> },
            { key: "items", header: "Products", cell: (o) => <span className="line-clamp-2 min-w-40">{o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</span> },
            { key: "total", header: "Total", cell: (o) => formatPeso(o.total), className: "tabular-nums whitespace-nowrap" },
            { key: "loc", header: "Delivery", cell: (o) => o.deliveryLocation },
            { key: "pay", header: "Payment", cell: (o) => <span className="whitespace-nowrap">{o.paymentMethod}</span> },
            {
              key: "status",
              header: "Status",
              cell: (o) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <OrderStatusBadge status={o.status} />
                  {o.aiAssisted && <AIBadge label="AI" />}
                </div>
              ),
            },
          ]}
          mobileCard={(o) => (
            <button type="button" onClick={() => open(o)} className="block w-full rounded-xl border bg-card p-4 text-left shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{o.reference} · {o.customerName}</p>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</p>
              <p className="mt-1 text-sm">{formatPeso(o.total)} · {o.deliveryLocation} · {timeAgo(o.createdAt)}</p>
            </button>
          )}
        />
      )}

      <OrderSheet order={selected} onClose={() => open(null)} onChange={replace} />
    </>
  );
}

function OrderSheet({ order, onClose, onChange }: { order: Order | null; onClose: () => void; onChange: (o: Order) => void }) {
  const [busy, setBusy] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [payment, setPayment] = React.useState("");

  React.useEffect(() => {
    setNotes(order?.notes ?? "");
    setPayment(order?.paymentMethod ?? "");
  }, [order?.id, order?.notes, order?.paymentMethod]);

  if (!order) return <Sheet open={false} />;
  const next = nextStatus(order.status);

  async function advance(to: OrderStatus) {
    if (!order) return;
    setBusy(true);
    try {
      onChange(await updateOrderStatus(order.id, to));
      toast.success(`${order.reference} → ${ORDER_STATUS_LABEL[to]}`);
    } catch {
      toast.error("Couldn't update the order.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails() {
    if (!order) return;
    onChange(await updateOrderDetails(order.id, { notes, paymentMethod: payment }));
    toast.success("Order details saved");
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {order.reference} <OrderStatusBadge status={order.status} />
          </SheetTitle>
          <SheetDescription>
            Created {formatDateTime(order.createdAt)} · {LEAD_SOURCE_LABEL[order.source]}
            {order.aiAssisted && " · AI-assisted"}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-6">
          {order.status !== "cancelled" && (
            <ol className="flex items-center gap-1" aria-label="Order progress">
              {FLOW.map((s, i) => {
                const reached = FLOW.indexOf(order.status) >= i;
                return (
                  <li key={s} className="flex-1" title={ORDER_STATUS_LABEL[s]}>
                    <span className={cn("block h-1.5 rounded-full", reached ? "bg-primary" : "bg-muted")} />
                    <span className="sr-only">{ORDER_STATUS_LABEL[s]}{reached ? " (done)" : ""}</span>
                  </li>
                );
              })}
            </ol>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Customer</h3>
            <dl className="grid gap-1.5 rounded-xl border p-4 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Name</dt><dd>{order.customerName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Mobile</dt><dd>{order.mobile}</dd></div>
              {order.messengerName && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Messenger</dt><dd>{order.messengerName}</dd></div>}
              {order.email && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Email</dt><dd>{order.email}</dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Preferred contact</dt><dd>{CHANNEL_LABEL[order.preferredContact]}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Deliver to</dt><dd>{order.deliveryLocation}</dd></div>
            </dl>
            <div className="flex gap-3 text-sm">
              {order.customerId && <Link href={`/admin/customers/${order.customerId}`} className="text-primary hover:underline">Customer profile</Link>}
              {order.leadId && <Link href={`/admin/leads/${order.leadId}`} className="text-primary hover:underline">Lead profile</Link>}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Items</h3>
            <ul className="divide-y rounded-xl border text-sm">
              {order.items.map((i) => (
                <li key={i.productSlug} className="flex justify-between gap-3 p-3">
                  <span>{i.quantity} × {i.productName}</span>
                  <span className="tabular-nums">{formatPeso(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between p-3 font-semibold">
                <span>Total (before delivery)</span>
                <span className="tabular-nums">{formatPeso(order.total)}</span>
              </li>
            </ul>
          </section>

          <section className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="payment" className="text-sm font-medium">Payment method</label>
              <NativeSelect id="payment" value={payment} onChange={(e) => setPayment(e.target.value)}>
                {["To be confirmed", "Cash on delivery", "GCash", "Maya", "Bank transfer"].map((m) => <option key={m}>{m}</option>)}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="order-notes" className="text-sm font-medium">Notes</label>
              <Textarea id="order-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" className="justify-self-start" onClick={saveDetails} disabled={notes === (order.notes ?? "") && payment === order.paymentMethod}>
              Save details
            </Button>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Status history</h3>
            <ol className="grid gap-2 text-sm">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={`${h.status}-${i}`} className="flex justify-between gap-3">
                  <span className="flex items-center gap-2"><Check className="size-3.5 text-success" aria-hidden />{ORDER_STATUS_LABEL[h.status]}</span>
                  <time className="text-muted-foreground" dateTime={h.at}>{formatDateTime(h.at)}</time>
                </li>
              ))}
            </ol>
          </section>
          {order.aiAssisted && (
            <p className="flex items-center gap-2 rounded-xl bg-primary-soft/50 p-3 text-xs text-accent-foreground">
              <Sparkles className="size-4" aria-hidden /> The AI assistant helped this customer before they ordered. It counts toward AI-attributed revenue once confirmed.
            </p>
          )}
        </SheetBody>
        <SheetFooter className="flex-wrap">
          {next && order.status !== "cancelled" && (
            <Button onClick={() => advance(next)} loading={busy} className="flex-1">
              Mark as {ORDER_STATUS_LABEL[next]} <ArrowRight aria-hidden />
            </Button>
          )}
          {!["delivered", "cancelled"].includes(order.status) && (
            <Button variant="ghost" className="text-destructive hover:bg-danger-soft" onClick={() => setCancelOpen(true)}>
              <XCircle aria-hidden /> Cancel order
            </Button>
          )}
          {order.status === "delivered" && <p className="text-sm text-muted-foreground">This order is complete.</p>}
          {order.status === "cancelled" && <p className="text-sm text-muted-foreground">This order was cancelled.</p>}
        </SheetFooter>
        <ConfirmDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          title={`Cancel ${order.reference}?`}
          description="The customer won't be notified automatically. Let them know through their preferred channel."
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          destructive
          onConfirm={() => advance("cancelled")}
        />
      </SheetContent>
    </Sheet>
  );
}
