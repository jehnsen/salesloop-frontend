import type { CreateFollowUpInput, FollowUp } from "@/types";
import { createId, dayOffset } from "@/lib/utils";
import { must, mutate, nowIso, query } from "./_mock";
import { addTimeline } from "./_records";

export type FollowUpView = "today" | "upcoming" | "overdue" | "completed";

export function followUpView(f: FollowUp): FollowUpView {
  if (f.status !== "scheduled") return "completed";
  const offset = dayOffset(f.scheduledAt);
  if (offset < 0) return "overdue";
  if (offset === 0) return "today";
  return "upcoming";
}

export function getFollowUps() {
  return query((db) => [...db.followUps].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
}

/** Today's and overdue follow-ups, oldest first. Used on the dashboard. */
export function getDueFollowUps(limit = 5) {
  return query((db) =>
    db.followUps
      .filter((f) => ["today", "overdue"].includes(followUpView(f)) || (f.status === "scheduled" && dayOffset(f.scheduledAt) === 1))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, limit),
  );
}

export function createFollowUp(input: CreateFollowUpInput) {
  return mutate((db) => {
    const followUp: FollowUp = {
      id: createId("fup"),
      status: "scheduled",
      createdBy: "seller",
      suggestedAction: "Reach out as planned.",
      suggestedMessage: input.suggestedMessage ?? `Hi ${input.customerName.split(" ")[0]}! Just following up. Let me know if you have any questions.`,
      ...input,
    };
    db.followUps.push(followUp);
    const lead = input.leadId ? db.leads.find((l) => l.id === input.leadId) : undefined;
    if (lead) {
      lead.nextFollowUpAt = input.scheduledAt;
      addTimeline(lead, { type: "follow_up", title: "Follow-up scheduled", description: input.reasonDetail });
    }
    return followUp;
  });
}

export function completeFollowUp(id: string, outcome?: string) {
  return mutate((db) => {
    const f = must(db.followUps.find((x) => x.id === id), "Follow-up", id);
    f.status = "completed";
    f.completedAt = nowIso();
    const lead = f.leadId ? db.leads.find((l) => l.id === f.leadId) : undefined;
    if (lead) {
      if (lead.nextFollowUpAt === f.scheduledAt) lead.nextFollowUpAt = undefined;
      addTimeline(lead, { type: "follow_up", title: "Follow-up completed", description: outcome });
    }
    return f;
  });
}

export function rescheduleFollowUp(id: string, scheduledAt: string) {
  return mutate((db) => {
    const f = must(db.followUps.find((x) => x.id === id), "Follow-up", id);
    f.scheduledAt = scheduledAt;
    f.status = "scheduled";
    const lead = f.leadId ? db.leads.find((l) => l.id === f.leadId) : undefined;
    if (lead) lead.nextFollowUpAt = scheduledAt;
    return f;
  });
}

export function skipFollowUp(id: string) {
  return mutate((db) => {
    const f = must(db.followUps.find((x) => x.id === id), "Follow-up", id);
    f.status = "skipped";
    f.completedAt = nowIso();
    return f;
  });
}

export function updateFollowUpMessage(id: string, suggestedMessage: string) {
  return mutate((db) => {
    const f = must(db.followUps.find((x) => x.id === id), "Follow-up", id);
    f.suggestedMessage = suggestedMessage;
    return f;
  });
}
