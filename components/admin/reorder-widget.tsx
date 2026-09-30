"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/lib/mock-data/site";
import { BellOff, CalendarPlus, MessageCircle, Phone, Repeat } from "lucide-react";
import { toast } from "sonner";
import type { ReorderPrediction } from "@/types";
import { getReorderOpportunities, snoozeReorder } from "@/services/customers";
import { createFollowUp } from "@/services/followups";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/misc";
import { LikelihoodBadge } from "@/components/shared/status-badges";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Panel, PanelSkeleton } from "./primitives";

function expectedLabel(p: ReorderPrediction) {
  if (p.daysUntilExpected > 1) return `Expected in ~${p.daysUntilExpected} days`;
  if (p.daysUntilExpected >= -1) return "Expected around now";
  return `${Math.abs(p.daysUntilExpected)} days past usual cycle`;
}

/** "Customers Likely to Reorder": mocked predictive logic from order history. */
export function ReorderWidget({ limit, className }: { limit?: number; className?: string }) {
  const { data, loading, error, reload, setData } = useAsync(() => getReorderOpportunities(limit), [limit]);
  const { name } = useProductLookup();
  const router = useRouter();
  const [contact, setContact] = React.useState<ReorderPrediction | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  useDbChange(() => void reload({ silent: true }));

  async function prepare(p: ReorderPrediction) {
    setBusy(`prep-${p.customerId}`);
    try {
      const at = new Date();
      at.setHours(at.getHours() + 2, 0, 0, 0);
      await createFollowUp({
        customerName: p.customerName,
        customerId: p.customerId,
        productSlug: p.productSlug,
        reason: "reorder_reminder",
        reasonDetail: `Last order ${p.daysSinceLastOrder} days ago. Typical cycle ~${p.typicalCycleDays} days.`,
        channel: "messenger",
        scheduledAt: at.toISOString(),
        suggestedMessage: `Hi ${p.customerName.split(" ")[0]}! Just checking if you're running low on ${name(p.productSlug)}. Would you like me to prepare your usual order this week?`,
      });
      toast.success(`Follow-up prepared for ${p.customerName}`, { action: { label: "View", onClick: () => router.push("/admin/follow-ups") } });
    } catch {
      toast.error("Couldn't create the follow-up.");
    } finally {
      setBusy(null);
    }
  }

  async function snooze(p: ReorderPrediction) {
    setBusy(`snooze-${p.customerId}`);
    try {
      await snoozeReorder(p.customerId, 7);
      setData((list) => list?.filter((x) => x.customerId !== p.customerId));
      toast.success(`${p.customerName} snoozed for 7 days`);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PanelSkeleton className={className} />;

  return (
    <Panel
      className={className}
      title={
        <span className="flex items-center gap-2">
          <Repeat className="size-4 text-leaf" aria-hidden /> Customers Likely to Reorder
        </span>
      }
      description="Predicted from each customer's usual order cycle."
      contentClassName="p-0"
    >
      {error ? (
        <ErrorState className="m-5" action={<Button variant="outline" onClick={() => reload()}>Retry</Button>} />
      ) : !data?.length ? (
        <EmptyState compact className="m-5" icon={Repeat} title="No reorders expected right now" description="We'll surface customers here as they approach their usual reorder time." />
      ) : (
        <ul className="divide-y">
          {data.map((p) => (
            <li key={p.customerId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar name={p.customerName} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/customers/${p.customerId}`} className="font-medium hover:underline">
                      {p.customerName}
                    </Link>
                    <LikelihoodBadge likelihood={p.likelihood} />
                  </div>
                  <p className="text-sm">{name(p.productSlug)}</p>
                  <p className="text-xs text-muted-foreground">
                    Last order: {p.daysSinceLastOrder} days ago · Typical cycle: ~{p.typicalCycleDays} days · {expectedLabel(p)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button size="sm" variant="soft" onClick={() => prepare(p)} loading={busy === `prep-${p.customerId}`}>
                  <CalendarPlus aria-hidden /> Prepare Follow-Up
                </Button>
                <Button size="sm" variant="outline" onClick={() => setContact(p)}>
                  <MessageCircle aria-hidden /> Contact
                </Button>
                <Button size="sm" variant="ghost" onClick={() => snooze(p)} loading={busy === `snooze-${p.customerId}`} aria-label={`Snooze ${p.customerName} for 7 days`}>
                  <BellOff aria-hidden /> Snooze
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ContactDialog prediction={contact} productName={contact ? name(contact.productSlug) : ""} onClose={() => setContact(null)} />
    </Panel>
  );
}

function ContactDialog({ prediction, productName, onClose }: { prediction: ReorderPrediction | null; productName: string; onClose: () => void }) {
  const message = prediction
    ? `Hi ${prediction.customerName.split(" ")[0]}! ${siteConfig.seller.name.split(" ")[0]} here from ${siteConfig.storeName}. Just checking if you'd like your usual ${productName} this week?`
    : "";
  return (
    <Dialog open={Boolean(prediction)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact {prediction?.customerName}</DialogTitle>
          <DialogDescription>Send a friendly reorder reminder. Copy the message or open a channel.</DialogDescription>
        </DialogHeader>
        <p className="rounded-xl bg-muted p-4 text-sm leading-relaxed">{message}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(message);
                toast.success("Message copied");
              } catch {
                toast.error("Couldn't copy the message");
              }
            }}
          >
            Copy message
          </Button>
          <Button variant="outline" asChild>
            <a href="sms:" onClick={() => toast.info("Opening your SMS app…")}>
              <Phone aria-hidden /> SMS
            </a>
          </Button>
          <Button asChild>
            <Link href={prediction ? `/admin/customers/${prediction.customerId}` : "#"} onClick={onClose}>
              Open profile
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
