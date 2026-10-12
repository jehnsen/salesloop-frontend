"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bot, CalendarPlus, Mail, MapPin, MessageCircle, Phone, Repeat, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { addCustomerNote, getCustomerById } from "@/services/customers";
import { getConversationById } from "@/services/conversations";
import { getFollowUps } from "@/services/followups";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { CHANNEL_LABEL, FOLLOW_UP_REASON_LABEL } from "@/lib/constants";
import { formatDate, formatPeso, friendlyDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { CustomerStatusBadge, FollowUpStatusBadge, LikelihoodBadge, OrderStatusBadge } from "@/components/shared/status-badges";
import { ConversationThread } from "@/components/admin/conversation-parts";
import { CreateFollowUpDialog } from "@/components/admin/create-follow-up-dialog";
import { AdminPageHeader, Panel, PanelSkeleton } from "@/components/admin/primitives";
import { ProductImage } from "@/components/site/product-image";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useAsync(() => getCustomerById(id), [id]);
  const conversation = useAsync(
    async () => (detail.data?.customer.conversationId ? getConversationById(detail.data.customer.conversationId) : null),
    [detail.data?.customer.conversationId],
  );
  const followUps = useAsync(async () => (await getFollowUps()).filter((f) => f.customerId === id), [id]);
  const { name, bySlug } = useProductLookup();
  const [note, setNote] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [followUpOpen, setFollowUpOpen] = React.useState(false);

  useDbChange(() => {
    void detail.reload({ silent: true });
    void followUps.reload({ silent: true });
  });

  if (detail.loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={8} />
      </div>
    );
  }
  if (detail.error) return <ErrorState action={<Button onClick={() => detail.reload()}>Retry</Button>} />;
  if (!detail.data) {
    return <EmptyState title="Customer not found" action={<Button asChild><Link href="/admin/customers">Back to customers</Link></Button>} />;
  }

  const { customer: c, orders } = detail.data;
  const p = c.nextReorder;
  const productCounts = new Map<string, number>();
  orders.filter((o) => o.status !== "cancelled").forEach((o) => o.items.forEach((i) => productCounts.set(i.productSlug, (productCounts.get(i.productSlug) ?? 0) + i.quantity)));
  const preferences = [...productCounts.entries()].sort((a, b) => b[1] - a[1]);

  async function saveNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addCustomerNote(c.id, note.trim());
      setNote("");
      toast.success("Note added");
      void detail.reload({ silent: true });
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={<span className="flex flex-wrap items-center gap-3">{c.name} <CustomerStatusBadge status={c.status} /></span>}
        description={`Customer since ${formatDate(c.customerSince)}`}
        actions={
          <>
            {c.conversationId && (
              <Button asChild>
                <Link href={`/admin/conversations?c=${c.conversationId}`}><MessageCircle aria-hidden /> Open conversation</Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => setFollowUpOpen(true)}>
              <CalendarPlus aria-hidden /> Create follow-up
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={c.name} className="size-12 text-sm" />
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">Prefers {CHANNEL_LABEL[c.preferredChannel]}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center gap-3"><Phone className="size-4 text-muted-foreground" aria-hidden /><dt className="sr-only">Mobile</dt><dd>{c.mobile}</dd></div>
              <div className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground" aria-hidden /><dt className="sr-only">Email</dt><dd>{c.email ?? "Not provided"}</dd></div>
              <div className="flex items-center gap-3"><MapPin className="size-4 text-muted-foreground" aria-hidden /><dt className="sr-only">Location</dt><dd>{c.location}</dd></div>
            </dl>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
              <div><dt className="text-xs text-muted-foreground">Lifetime orders</dt><dd className="text-xl font-semibold">{c.lifetimeOrders}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Lifetime value</dt><dd className="text-xl font-semibold">{formatPeso(c.lifetimeValue)}</dd></div>
            </dl>
            {c.leadId && (
              <Button variant="link" size="sm" asChild className="mt-3">
                <Link href={`/admin/leads/${c.leadId}`}>View original lead →</Link>
              </Button>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-primary-soft/50 px-5 py-3">
              <Bot className="size-4 text-accent-foreground" aria-hidden />
              <h2 className="text-sm font-semibold">AI insights</h2>
            </div>
            <div className="space-y-4 p-5">
              {p && (
                <div className="rounded-xl border p-4">
                  <p className="flex items-center gap-2 text-sm font-medium"><Repeat className="size-4 text-leaf" aria-hidden /> Next reorder prediction</p>
                  <p className="mt-2 text-sm">{name(p.productSlug)}</p>
                  <p className="text-xs text-muted-foreground">
                    Last order {p.daysSinceLastOrder} days ago · cycle ~{p.typicalCycleDays} days
                  </p>
                  <div className="mt-2"><LikelihoodBadge likelihood={p.likelihood} /></div>
                </div>
              )}
              <ul className="grid gap-2 text-sm">
                {c.aiInsights.map((i) => (
                  <li key={i} className="flex gap-2"><span className="text-leaf" aria-hidden>•</span>{i}</li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="min-w-0">
          <TabsList className="mb-4">
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <DataTable
              rows={orders}
              rowKey={(o) => o.id}
              caption="Order history"
              empty={{ title: "No orders yet" }}
              columns={[
                { key: "ref", header: "Order", cell: (o) => <Link href={`/admin/orders?focus=${o.id}`} className="font-medium hover:underline">{o.reference}</Link> },
                { key: "date", header: "Date", cell: (o) => formatDate(o.createdAt) },
                { key: "items", header: "Items", cell: (o) => o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ") },
                { key: "total", header: "Total", cell: (o) => formatPeso(o.total), className: "tabular-nums" },
                { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
              ]}
              mobileCard={(o) => (
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between"><p className="font-medium">{o.reference}</p><OrderStatusBadge status={o.status} /></div>
                  <p className="mt-1 text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</p>
                  <p className="mt-1 text-sm">{formatDate(o.createdAt)} · {formatPeso(o.total)}</p>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="preferences">
            <Panel title="Product preferences" description="Based on total quantity ordered">
              {preferences.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {preferences.map(([slug, qty]) => {
                    const product = bySlug.get(slug);
                    return (
                      <li key={slug} className="flex items-center gap-3 rounded-xl border p-3">
                        {product && <div className="w-14 overflow-hidden rounded-lg"><ProductImage src={product.images?.[0]} visual={product.visual} tone={product.tone} name={product.name} /></div>}
                        <div>
                          <p className="font-medium">{name(slug)}</p>
                          <p className="text-sm text-muted-foreground">{qty} units ordered</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState compact title="No preferences yet" />
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="conversation">
            <Panel title="Conversation history">
              {conversation.data ? (
                <ConversationThread messages={conversation.data.messages.filter((m) => !m.isDraft)} productName={name} />
              ) : (
                <EmptyState compact icon={MessageCircle} title="No conversation on record" description="Messages from Messenger or the website chat will show here." />
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="followups">
            <Panel title="Follow-up history">
              {followUps.data?.length ? (
                <ul className="divide-y">
                  {followUps.data.map((f) => (
                    <li key={f.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                      <div>
                        <p className="text-sm font-medium">{FOLLOW_UP_REASON_LABEL[f.reason]}</p>
                        <p className="text-sm text-muted-foreground">{f.reasonDetail}</p>
                        <p className="text-xs text-muted-foreground">{friendlyDay(f.scheduledAt)} · {CHANNEL_LABEL[f.channel]}</p>
                      </div>
                      <FollowUpStatusBadge status={f.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="No follow-ups yet" action={<Button size="sm" onClick={() => setFollowUpOpen(true)}>Create follow-up</Button>} />
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="notes">
            <Panel title="Notes">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <label htmlFor="customer-note" className="sr-only">New note</label>
                <Textarea id="customer-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Prefers Saturday delivery" className="min-h-16 flex-1" />
                <Button onClick={saveNote} loading={savingNote} disabled={!note.trim()}>Add note</Button>
              </div>
              {c.notes.length ? (
                <ul className="grid gap-2">{c.notes.map((n, i) => <li key={i} className="rounded-xl bg-muted/60 p-3 text-sm">{n}</li>)}</ul>
              ) : (
                <EmptyState compact icon={StickyNote} title="No notes yet" />
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <CreateFollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        target={{ customerName: c.name, customerId: c.id, productSlug: p?.productSlug ?? c.favoriteProducts[0], channel: c.preferredChannel, reason: "reorder_reminder" }}
        onCreated={() => void followUps.reload({ silent: true })}
      />
    </>
  );
}
