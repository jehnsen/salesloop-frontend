"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Bot,
  CalendarPlus,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  StickyNote,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import type { PipelineStage } from "@/types";
import { addLeadNote, convertLeadToCustomer, getLeadById, logSellerMessage, updateLeadStage } from "@/services/leads";
import { getConversationById } from "@/services/conversations";
import { useAsync, useDbChange } from "@/lib/hooks/use-async";
import { useProductLookup } from "@/lib/hooks/use-products";
import { CHANNEL_LABEL, INTENT_LABEL, LEAD_SOURCE_LABEL, STAGE_LABEL } from "@/lib/constants";
import { siteConfig } from "@/lib/mock-data/site";
import { formatDateTime, friendlyDay, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { PipelineStageBadge, PurchaseIntentBadge } from "@/components/shared/status-badges";
import { Timeline } from "@/components/shared/timeline";
import { ConversationThread } from "@/components/admin/conversation-parts";
import { CreateFollowUpDialog } from "@/components/admin/create-follow-up-dialog";
import { AdminPageHeader, Panel, PanelSkeleton } from "@/components/admin/primitives";
import { ScoreRing } from "@/components/admin/score-ring";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lead = useAsync(() => getLeadById(id), [id]);
  const conversation = useAsync(
    async () => (lead.data?.conversationId ? getConversationById(lead.data.conversationId) : null),
    [lead.data?.conversationId],
  );
  const { name } = useProductLookup();
  const [dialog, setDialog] = React.useState<"message" | "note" | "followup" | "lost" | "convert" | null>(null);
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  useDbChange(() => void lead.reload({ silent: true }));

  if (lead.loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={8} />
      </div>
    );
  }
  if (lead.error) return <ErrorState action={<Button onClick={() => lead.reload()}>Retry</Button>} />;
  if (!lead.data) {
    return (
      <EmptyState
        title="Lead not found"
        description="It may have been removed, or the demo data was reset."
        action={<Button asChild><Link href="/admin/leads">Back to leads</Link></Button>}
      />
    );
  }

  const l = lead.data;
  const closed = l.stage === "converted" || l.stage === "lost";

  async function setStage(stage: PipelineStage, reason: string) {
    try {
      lead.setData(await updateLeadStage(l.id, stage, reason));
      toast.success(`Moved to ${STAGE_LABEL[stage]}`);
    } catch {
      toast.error("Couldn't update the lead.");
    }
  }

  async function submitText() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      if (dialog === "note") {
        lead.setData(await addLeadNote(l.id, text.trim()));
        toast.success("Note added");
      } else {
        await navigator.clipboard?.writeText(text.trim()).catch(() => undefined);
        lead.setData(await logSellerMessage(l.id, text.trim(), CHANNEL_LABEL[l.preferredChannel]));
        toast.success("Message copied and logged. Paste it in your messaging app.");
      }
      setDialog(null);
      setText("");
    } finally {
      setSaving(false);
    }
  }

  function openMessage() {
    if (l.conversationId) return router.push(`/admin/conversations?c=${l.conversationId}`);
    setText(`Hi ${l.name.split(" ")[0]}! This is ${siteConfig.seller.name.split(" ")[0]} from ${siteConfig.storeName}. `);
    setDialog("message");
  }

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/leads", label: "Leads" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {l.name} <PipelineStageBadge stage={l.stage} />
          </span>
        }
        description={`${LEAD_SOURCE_LABEL[l.source]} · Created ${formatDateTime(l.createdAt)} · Assigned to ${l.assignedTo}`}
        actions={
          <>
            <Button onClick={openMessage}>
              <MessageCircle aria-hidden /> Message customer
            </Button>
            <Button variant="outline" onClick={() => setDialog("followup")} disabled={closed}>
              <CalendarPlus aria-hidden /> Create follow-up
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={l.name} className="size-12 text-sm" />
              <div>
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm text-muted-foreground">Prefers {CHANNEL_LABEL[l.preferredChannel]}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center gap-3"><Phone className="size-4 text-muted-foreground" aria-hidden /><dt className="sr-only">Mobile</dt><dd>{l.mobile ?? "Not provided"}</dd></div>
              <div className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground" aria-hidden /><dt className="sr-only">Email</dt><dd>{l.email ?? "Not provided"}</dd></div>
              {l.messengerName && <div className="flex items-center gap-3"><MessageCircle className="size-4 text-muted-foreground" aria-hidden /><dt className="sr-only">Messenger</dt><dd>{l.messengerName}</dd></div>}
              <div className="flex items-center gap-3"><MapPin className="size-4 text-muted-foreground" aria-hidden /><dt className="sr-only">Location</dt><dd>{l.location ?? "Unknown location"}</dd></div>
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" disabled={closed || l.stage === "qualified"} onClick={() => setStage("qualified", "Marked qualified by seller")}>
                <CheckCircle2 aria-hidden /> Mark qualified
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setText(""); setDialog("note"); }}>
                <StickyNote aria-hidden /> Add note
              </Button>
              <Button size="sm" variant="soft" disabled={l.stage === "converted"} onClick={() => setDialog("convert")}>
                <UserCheck aria-hidden /> Convert
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:bg-danger-soft" disabled={l.stage === "lost"} onClick={() => setDialog("lost")}>
                <UserX aria-hidden /> Mark lost
              </Button>
            </div>
            {l.customerId && (
              <Button variant="link" size="sm" asChild className="mt-3">
                <Link href={`/admin/customers/${l.customerId}`}>View customer profile →</Link>
              </Button>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-primary-soft/50 px-5 py-3">
              <Bot className="size-4 text-accent-foreground" aria-hidden />
              <h2 className="text-sm font-semibold">AI lead intelligence</h2>
            </div>
            <div className="space-y-5 p-5">
              <div className="flex items-center gap-4">
                <ScoreRing score={l.leadScore} />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Purchase intent</p>
                  <PurchaseIntentBadge intent={l.purchaseIntent} />
                  <p className="text-xs text-muted-foreground">Last intent: {INTENT_LABEL[l.lastIntent]}</p>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Products interested in</p>
                {l.interests.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {l.interests.map((i) => (
                      <li key={i.productSlug} className="rounded-full bg-muted px-2.5 py-1 text-sm">
                        {name(i.productSlug)}{i.quantity ? ` × ${i.quantity}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None detected yet</p>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Preferred channel</p>
                <p className="text-sm">{CHANNEL_LABEL[l.preferredChannel]}</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Detected objections</p>
                {l.objections.length ? (
                  <ul className="grid gap-1 text-sm">
                    {l.objections.map((o) => <li key={o}>• {o}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-4">
                <p className="text-xs font-semibold tracking-wide text-accent-foreground uppercase">AI recommendation</p>
                <p className="mt-1.5 text-sm leading-relaxed">{l.aiSummary}</p>
                <p className="mt-2 text-sm font-medium">Next: {l.recommendedAction}</p>
                {l.nextFollowUpAt && <p className="mt-2 text-xs text-muted-foreground">Follow-up scheduled {friendlyDay(l.nextFollowUpAt)}</p>}
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="min-w-0">
          <TabsList className="mb-4">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="notes">Notes ({l.notes.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <Panel title="Activity timeline" description={`Last activity ${timeAgo(l.lastActivityAt)}`}>
              {l.timeline.length ? <Timeline events={l.timeline} /> : <EmptyState compact title="No activity yet" />}
            </Panel>
          </TabsContent>
          <TabsContent value="conversation">
            <Panel
              title="Conversation history"
              description="AI analysis is shown under each customer message (visible to you only)."
              action={
                l.conversationId && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/conversations?c=${l.conversationId}`}>Open in inbox</Link>
                  </Button>
                )
              }
            >
              {conversation.loading ? (
                <PanelSkeleton rows={3} className="border-0 shadow-none" />
              ) : conversation.data ? (
                <ConversationThread messages={conversation.data.messages.filter((m) => !m.isDraft)} productName={name} />
              ) : (
                <EmptyState compact icon={MessageCircle} title="No chat transcript" description="This lead came from a form or an outside channel." />
              )}
            </Panel>
          </TabsContent>
          <TabsContent value="notes">
            <Panel title="Notes" action={<Button size="sm" onClick={() => { setText(""); setDialog("note"); }}>Add note</Button>}>
              {l.notes.length ? (
                <ul className="grid gap-3">
                  {l.notes.map((n, i) => (
                    <li key={i} className="rounded-xl bg-muted/60 p-3 text-sm">{n}</li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon={StickyNote} title="No notes yet" description="Keep track of preferences, delivery details, or anything useful." />
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialog === "note" || dialog === "message"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "note" ? "Add note" : `Message ${l.name}`}</DialogTitle>
            <DialogDescription>
              {dialog === "note"
                ? "Notes are private to you."
                : `We'll copy the message so you can send it via ${CHANNEL_LABEL[l.preferredChannel]}, and log it on the timeline.`}
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="lead-text" className="sr-only">{dialog === "note" ? "Note" : "Message"}</label>
          <Textarea id="lead-text" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={submitText} loading={saving} disabled={!text.trim()}>
              {dialog === "note" ? "Save note" : <><Send aria-hidden /> Copy & log message</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateFollowUpDialog
        open={dialog === "followup"}
        onOpenChange={(o) => !o && setDialog(null)}
        target={{ customerName: l.name, leadId: l.id, productSlug: l.interests[0]?.productSlug, channel: l.preferredChannel, reason: "incomplete_inquiry" }}
        onCreated={() => void lead.reload({ silent: true })}
      />
      <ConfirmDialog
        open={dialog === "lost"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Mark ${l.name} as lost?`}
        description="Follow-ups for this lead will stop. You can move them back to any stage later."
        confirmLabel="Mark lost"
        destructive
        onConfirm={() => setStage("lost", "Marked lost by seller")}
      />
      <ConfirmDialog
        open={dialog === "convert"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Convert ${l.name} to a customer?`}
        description="A customer profile will be created (or linked if one exists with the same mobile number)."
        confirmLabel="Convert to customer"
        onConfirm={async () => {
          const { lead: updated, customer } = await convertLeadToCustomer(l.id);
          lead.setData(updated);
          toast.success(`${l.name} is now a customer`, {
            action: { label: "View", onClick: () => router.push(`/admin/customers/${customer.id}`) },
          });
        }}
      />
    </>
  );
}
