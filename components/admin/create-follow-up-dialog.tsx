"use client";

import * as React from "react";
import { toast } from "sonner";
import type { ContactChannel, FollowUp, FollowUpReason } from "@/types";
import { CHANNEL_LABEL, FOLLOW_UP_REASON_LABEL } from "@/lib/constants";
import { createFollowUp } from "@/services/followups";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";

function defaultDateTime() {
  const d = new Date(Date.now() + 24 * 3_600_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

export interface FollowUpTarget {
  customerName: string;
  leadId?: string;
  customerId?: string;
  productSlug?: string;
  channel?: ContactChannel;
  suggestedMessage?: string;
  reason?: FollowUpReason;
}

export function CreateFollowUpDialog({
  target,
  open,
  onOpenChange,
  onCreated,
}: {
  target: FollowUpTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (f: FollowUp) => void;
}) {
  const [when, setWhen] = React.useState(defaultDateTime);
  const [reason, setReason] = React.useState<FollowUpReason>("general");
  const [channel, setChannel] = React.useState<ContactChannel>("sms");
  const [detail, setDetail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !target) return;
    setWhen(defaultDateTime());
    setReason(target.reason ?? "general");
    setChannel(target.channel ?? "sms");
    setDetail("");
    setMessage(target.suggestedMessage ?? `Hi ${target.customerName.split(" ")[0]}! Just following up. Let me know if you have any questions.`);
    setError(undefined);
  }, [open, target]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const at = new Date(when);
    if (Number.isNaN(at.getTime())) return setError("Please choose a valid date and time.");
    if (at.getTime() < Date.now() - 60_000) return setError("Pick a time in the future.");
    setSaving(true);
    try {
      const created = await createFollowUp({
        customerName: target.customerName,
        leadId: target.leadId,
        customerId: target.customerId,
        productSlug: target.productSlug,
        reason,
        reasonDetail: detail || FOLLOW_UP_REASON_LABEL[reason],
        channel,
        scheduledAt: at.toISOString(),
        suggestedMessage: message,
      });
      toast.success(`Follow-up scheduled for ${target.customerName}`);
      onCreated?.(created);
      onOpenChange(false);
    } catch {
      toast.error("Couldn't create the follow-up.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Create follow-up</DialogTitle>
            <DialogDescription>Schedule a reminder to reach out to {target?.customerName}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="fu-when" label="Date & time" error={error}>
              {(p) => <Input {...p} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}
            </FormField>
            <FormField id="fu-channel" label="Channel">
              {(p) => (
                <NativeSelect {...p} value={channel} onChange={(e) => setChannel(e.target.value as ContactChannel)}>
                  {Object.entries(CHANNEL_LABEL).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
          </div>
          <FormField id="fu-reason" label="Reason">
            {(p) => (
              <NativeSelect {...p} value={reason} onChange={(e) => setReason(e.target.value as FollowUpReason)}>
                {Object.entries(FOLLOW_UP_REASON_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField id="fu-detail" label="Notes" optional>
            {(p) => <Input {...p} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. Asked about 3 boxes" />}
          </FormField>
          <FormField id="fu-message" label="Message to send" hint="Pre-filled by the AI. Edit as needed.">
            {(p) => <Textarea {...p} value={message} onChange={(e) => setMessage(e.target.value)} />}
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Schedule follow-up</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
