"use client";

import Link from "next/link";
import { Bot, ExternalLink } from "lucide-react";
import type { Conversation } from "@/types";
import { getCustomerById } from "@/services/customers";
import { getLeadById } from "@/services/leads";
import { useAsync } from "@/lib/hooks/use-async";
import { CONVERSATION_CHANNEL_LABEL, NEXT_ACTION_LABEL } from "@/lib/constants";
import { formatDate, formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/misc";
import { IntentBadge, LeadScoreBadge, PipelineStageBadge, PurchaseIntentBadge } from "@/components/shared/status-badges";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}

/** Right-hand panel of the inbox: what the AI knows about this customer. */
export function CustomerIntelPanel({ conversation, productName }: { conversation: Conversation; productName: (slug?: string) => string }) {
  const lead = useAsync(async () => (conversation.leadId ? getLeadById(conversation.leadId) : null), [conversation.leadId]);
  const customer = useAsync(async () => (conversation.customerId ? getCustomerById(conversation.customerId) : null), [conversation.customerId]);
  const a = conversation.latestAnalysis;
  const l = lead.data;
  const c = customer.data?.customer;
  const lastOrder = customer.data?.orders.find((o) => o.status !== "cancelled" && o.status !== "inquiry");

  if (lead.loading || customer.loading) {
    return (
      <div className="space-y-3 p-5" role="status" aria-label="Loading customer details">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const productSlugs = a?.products.length ? a.products : l?.interests.map((i) => i.productSlug) ?? c?.favoriteProducts ?? [];
  const nextAction = l?.recommendedAction ?? (a?.nextAction ? NEXT_ACTION_LABEL[a.nextAction] : "Reply to the customer.");

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center gap-3">
        <Avatar name={conversation.customerName} className="size-11" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{conversation.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {c ? "Customer" : l ? "Lead" : "Visitor"} · {CONVERSATION_CHANNEL_LABEL[conversation.channel]}
          </p>
        </div>
      </div>

      <dl className="divide-y rounded-xl border px-4">
        <Row label="Lead score">{l || a?.leadScore !== undefined ? <LeadScoreBadge score={l?.leadScore ?? a?.leadScore ?? 0} /> : "—"}</Row>
        <Row label="Intent">{a ? <IntentBadge intent={a.intent} /> : "—"}</Row>
        <Row label="Purchase intent">{a || l ? <PurchaseIntentBadge intent={l?.purchaseIntent ?? a!.purchaseIntent} /> : "—"}</Row>
        <Row label="Stage">{l ? <PipelineStageBadge stage={l.stage} /> : c ? "Customer" : "—"}</Row>
        <Row label="Product interest">{productSlugs.length ? productSlugs.map((s) => productName(s)).join(", ") : "—"}</Row>
        {a?.quantity && <Row label="Quantity">{a.quantity}</Row>}
        <Row label="Location">{a?.location ?? l?.location ?? c?.location ?? "—"}</Row>
        <Row label="Last order">
          {lastOrder ? `${formatDate(lastOrder.createdAt)} · ${formatPeso(lastOrder.total)}` : "None yet"}
        </Row>
      </dl>

      <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent-foreground uppercase">
          <Bot className="size-3.5" aria-hidden /> AI suggested next action
        </p>
        <p className="mt-1.5 text-sm">{nextAction}</p>
        {a?.medicalFlag && (
          <p className="mt-2 text-xs text-destructive">Health question: share label info only and recommend a healthcare professional.</p>
        )}
      </div>

      <div className="grid gap-2">
        {l && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/leads/${l.id}`}>Open lead profile <ExternalLink aria-hidden /></Link>
          </Button>
        )}
        {c && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/customers/${c.id}`}>Open customer profile <ExternalLink aria-hidden /></Link>
          </Button>
        )}
      </div>
    </div>
  );
}
