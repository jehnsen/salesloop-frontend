import type { AIActivity, Lead, LeadSource, TimelineEvent } from "@/types";
import type { MockDatabase } from "@/lib/mock-data/store";
import { createId } from "@/lib/utils";

/** Internal helpers shared by services that write related records together. */

export function logActivity(db: MockDatabase, entry: Omit<AIActivity, "id" | "timestamp">) {
  const activity: AIActivity = { id: createId("act"), timestamp: new Date().toISOString(), ...entry };
  db.aiActivity.unshift(activity);
  return activity;
}

export function addTimeline(lead: Lead, event: Omit<TimelineEvent, "id" | "timestamp">) {
  const now = new Date().toISOString();
  lead.timeline.unshift({ id: createId("evt"), timestamp: now, ...event });
  lead.lastActivityAt = now;
}

const normalizeMobile = (v?: string) => (v ? v.replace(/\D/g, "").replace(/^63/, "0") : "");

export function findLeadByMobile(db: MockDatabase, mobile?: string) {
  const m = normalizeMobile(mobile);
  return m ? db.leads.find((l) => normalizeMobile(l.mobile) === m) : undefined;
}

export function findCustomerByMobileSync(db: MockDatabase, mobile?: string) {
  const m = normalizeMobile(mobile);
  return m ? db.customers.find((c) => normalizeMobile(c.mobile) === m) : undefined;
}

export function createLeadRecord(
  db: MockDatabase,
  data: Pick<Lead, "name"> & Partial<Lead> & { source: LeadSource },
): Lead {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: createId("led"),
    interests: [],
    leadScore: 40,
    purchaseIntent: "medium",
    lastIntent: "general_question",
    stage: "new",
    preferredChannel: "sms",
    objections: [],
    aiSummary: "",
    recommendedAction: "Reach out to confirm the customer's needs.",
    lastActivityAt: now,
    assignedTo: db.siteConfig.seller.name,
    createdAt: now,
    timeline: [],
    notes: [],
    ...data,
  };
  db.leads.unshift(lead);
  return lead;
}
