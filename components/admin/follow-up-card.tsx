"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, CalendarClock, Check, Copy, MoreHorizontal, SkipForward, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { FollowUp } from "@/types";
import { CHANNEL_LABEL, FOLLOW_UP_REASON_LABEL } from "@/lib/constants";
import { completeFollowUp, followUpView, rescheduleFollowUp, skipFollowUp, updateFollowUpMessage } from "@/services/followups";
import { cn, friendlyDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { FollowUpStatusBadge } from "@/components/shared/status-badges";

function tomorrowAt9() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/** Compact row for the dashboard. */
export function FollowUpRow({ followUp, productName }: { followUp: FollowUp; productName: string }) {
  const view = followUpView(followUp);
  const href = followUp.leadId ? `/admin/leads/${followUp.leadId}` : followUp.customerId ? `/admin/customers/${followUp.customerId}` : "/admin/follow-ups";
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg p-2 -m-2 transition-colors hover:bg-muted/60">
      <Avatar name={followUp.customerName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {followUp.customerName} <span className="font-normal text-muted-foreground">· {followUp.productSlug ? productName : FOLLOW_UP_REASON_LABEL[followUp.reason]}</span>
        </p>
        <p className={cn("text-xs", view === "overdue" ? "font-medium text-destructive" : "text-muted-foreground")}>
          {view === "overdue" ? "Overdue · " : ""}
          {friendlyDay(followUp.scheduledAt)} · {FOLLOW_UP_REASON_LABEL[followUp.reason]}
        </p>
      </div>
    </Link>
  );
}

/** Full card with the AI-suggested message and actions. */
export function FollowUpCard({
  followUp,
  productName,
  onChange,
}: {
  followUp: FollowUp;
  productName?: string;
  onChange: (updated: FollowUp) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(followUp.suggestedMessage);
  const [busy, setBusy] = React.useState<string | null>(null);
  const view = followUpView(followUp);
  const done = followUp.status !== "scheduled";
  const href = followUp.leadId ? `/admin/leads/${followUp.leadId}` : followUp.customerId ? `/admin/customers/${followUp.customerId}` : undefined;

  async function run(label: string, action: () => Promise<FollowUp>, success: string) {
    setBusy(label);
    try {
      onChange(await action());
      toast.success(success);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(followUp.suggestedMessage);
      toast.success("Message copied. Paste it into Messenger or SMS.");
    } catch {
      toast.error("Couldn't copy. Select the text manually.");
    }
  }

  return (
    <Card className={cn("flex flex-col gap-4 p-5", view === "overdue" && "border-destructive/30", done && "opacity-80")}>
      <div className="flex items-start gap-3">
        <Avatar name={followUp.customerName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {href ? (
              <Link href={href} className="font-semibold hover:underline">{followUp.customerName}</Link>
            ) : (
              <p className="font-semibold">{followUp.customerName}</p>
            )}
            <FollowUpStatusBadge status={followUp.status} overdue={view === "overdue"} />
          </div>
          <p className="text-sm text-muted-foreground">
            {productName ? `${productName} · ` : ""}
            {FOLLOW_UP_REASON_LABEL[followUp.reason]} · {CHANNEL_LABEL[followUp.channel]}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label={`More actions for ${followUp.customerName}`}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {href && (
              <DropdownMenuItem asChild>
                <Link href={href}><UserRound /> Open profile</Link>
              </DropdownMenuItem>
            )}
            {!done && (
              <>
                <DropdownMenuItem onSelect={() => run("reschedule", () => rescheduleFollowUp(followUp.id, tomorrowAt9()), "Moved to tomorrow, 9:00 AM")}>
                  <CalendarClock /> Move to tomorrow 9 AM
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => run("skip", () => skipFollowUp(followUp.id), "Follow-up skipped")}>
                  <SkipForward /> Skip
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <dl className="grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted-foreground">Scheduled</dt>
          <dd className={cn(view === "overdue" && "font-medium text-destructive")}>{friendlyDay(followUp.scheduledAt)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted-foreground">Reason</dt>
          <dd>{followUp.reasonDetail}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted-foreground">Suggested</dt>
          <dd className="font-medium">{followUp.suggestedAction}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-primary/15 bg-primary-soft/40 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
          <Bot className="size-3.5" aria-hidden /> {followUp.createdBy === "ai" ? "AI suggested message" : "Message"}
        </p>
        {editing ? (
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Edit suggested message" className="min-h-20 bg-card text-sm" />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setDraft(followUp.suggestedMessage); setEditing(false); }}>Cancel</Button>
              <Button
                size="sm"
                loading={busy === "save"}
                onClick={() => run("save", () => updateFollowUpMessage(followUp.id, draft), "Message updated").then(() => setEditing(false))}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{followUp.suggestedMessage}</p>
        )}
      </div>

      {!done && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => run("done", () => completeFollowUp(followUp.id, "Seller followed up"), `Marked ${followUp.customerName} as done`)} loading={busy === "done"}>
            <Check aria-hidden /> Mark done
          </Button>
          <Button size="sm" variant="outline" onClick={copy}>
            <Copy aria-hidden /> Copy message
          </Button>
          {!editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
