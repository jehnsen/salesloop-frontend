import type { Customer, Lead, LeadCaptureInput, PipelineStage } from "@/types";
import type { MockDatabase } from "@/lib/mock-data/store";
import { STAGE_LABEL } from "@/lib/constants";
import { createId } from "@/lib/utils";
import { must, mutate, nowIso, query } from "./_mock";
import { addTimeline, createLeadRecord, findLeadByMobile, logActivity } from "./_records";

export interface LeadFilters {
  search?: string;
  stage?: PipelineStage | "all";
  minScore?: number;
  product?: string;
  source?: Lead["source"] | "all";
  followUp?: "all" | "due" | "scheduled" | "none";
  createdWithinDays?: number;
}

export function getLeads(filters: LeadFilters = {}) {
  return query((db) => {
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const search = filters.search?.trim().toLowerCase();
    return db.leads
      .filter((l) => {
        if (filters.stage && filters.stage !== "all" && l.stage !== filters.stage) return false;
        if (filters.minScore && l.leadScore < filters.minScore) return false;
        if (filters.product && filters.product !== "all" && !l.interests.some((i) => i.productSlug === filters.product)) return false;
        if (filters.source && filters.source !== "all" && l.source !== filters.source) return false;
        if (filters.createdWithinDays && now - new Date(l.createdAt).getTime() > filters.createdWithinDays * 86_400_000) return false;
        if (filters.followUp === "due" && !(l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= endOfToday)) return false;
        if (filters.followUp === "scheduled" && !l.nextFollowUpAt) return false;
        if (filters.followUp === "none" && l.nextFollowUpAt) return false;
        if (search) {
          const haystack = [l.name, l.mobile, l.email, l.location, l.messengerName].filter(Boolean).join(" ").toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  });
}

export function getHighPriorityLeads(limit = 5) {
  return query((db) =>
    db.leads
      .filter((l) => !["converted", "lost"].includes(l.stage) && l.purchaseIntent === "high")
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, limit),
  );
}

export function getLeadById(id: string) {
  return query((db) => db.leads.find((l) => l.id === id) ?? null);
}

export function updateLeadStage(id: string, stage: PipelineStage, reason?: string) {
  return mutate((db) => {
    const lead = must(db.leads.find((l) => l.id === id), "Lead", id);
    if (lead.stage === stage) return lead;
    lead.stage = stage;
    if (stage === "lost" || stage === "converted") lead.nextFollowUpAt = undefined;
    addTimeline(lead, { type: "stage_change", title: `Stage changed to ${STAGE_LABEL[stage]}`, description: reason });
    return lead;
  });
}

export function addLeadNote(id: string, note: string) {
  return mutate((db) => {
    const lead = must(db.leads.find((l) => l.id === id), "Lead", id);
    lead.notes.unshift(note);
    addTimeline(lead, { type: "note", title: "Note added", description: note });
    return lead;
  });
}

/** Converts a lead into a customer record (or links to an existing one with the same mobile). */
export function convertLeadToCustomer(id: string) {
  return mutate((db) => {
    const lead = must(db.leads.find((l) => l.id === id), "Lead", id);
    let customer = lead.customerId ? db.customers.find((c) => c.id === lead.customerId) : undefined;
    if (!customer) {
      customer = {
        id: createId("cus"),
        name: lead.name,
        mobile: lead.mobile ?? "",
        email: lead.email,
        messengerName: lead.messengerName,
        location: lead.location ?? "",
        status: "active",
        preferredChannel: lead.preferredChannel,
        favoriteProducts: lead.interests.map((i) => i.productSlug),
        customerSince: nowIso(),
        notes: [],
        aiInsights: [`Converted from ${lead.source.replace("_", " ")} lead with score ${lead.leadScore}.`],
        leadId: lead.id,
        conversationId: lead.conversationId,
      } satisfies Customer;
      db.customers.unshift(customer);
    }
    lead.customerId = customer.id;
    lead.stage = "converted";
    lead.nextFollowUpAt = undefined;
    addTimeline(lead, { type: "stage_change", title: "Converted to customer" });
    return { lead, customer };
  });
}

/**
 * Called by the customer chat when the visitor shares name + mobile.
 * Creates (or updates) a lead with the AI analysis, logs AI activity, and
 * schedules a follow-up for the seller.
 */
export function captureLeadFromChat(input: LeadCaptureInput & { conversationId?: string }) {
  return mutate((db) => captureLeadInDb(db, input));
}

/** Internal, synchronous version used when lead capture is part of a larger write. */
export function captureLeadInDb(db: MockDatabase, input: LeadCaptureInput & { conversationId?: string }): Lead {
  const a = input.analysis;
  let lead = findLeadByMobile(db, input.mobile);
  const isNew = !lead;
  const interests = input.productSlug ? [{ productSlug: input.productSlug, quantity: input.quantity }] : [];
  const product = db.products.find((p) => p.slug === input.productSlug);
  const summaryParts = [
    product ? `Asked about ${input.quantity ? `${input.quantity} × ` : ""}${product.name}` : "Chatted with the AI assistant",
    input.location ? `from ${input.location}` : undefined,
    "and shared contact details. No order confirmed yet.",
  ].filter(Boolean);

  if (!lead) {
    lead = createLeadRecord(db, {
      name: input.name,
      mobile: input.mobile,
      location: input.location,
      source: "website_chat",
      interests,
      leadScore: Math.max(a?.leadScore ?? 60, 60),
      purchaseIntent: a?.purchaseIntent ?? "medium",
      lastIntent: a?.intent ?? "product_inquiry",
      stage: input.quantity && input.location ? "interested" : "qualified",
      preferredChannel: input.preferredChannel ?? "sms",
      objections: a?.objections ?? [],
      aiSummary: summaryParts.join(" "),
      recommendedAction: "Follow up within 24 hours with the total amount and delivery options.",
      conversationId: input.conversationId,
    });
    addTimeline(lead, { type: "website_visit", title: "Started a website AI chat" });
  } else {
    lead.interests = interests.length ? interests : lead.interests;
    lead.location = input.location ?? lead.location;
    lead.leadScore = Math.max(lead.leadScore, a?.leadScore ?? 0);
    lead.purchaseIntent = a?.purchaseIntent ?? lead.purchaseIntent;
    lead.conversationId = input.conversationId ?? lead.conversationId;
    if (["new", "engaged"].includes(lead.stage)) lead.stage = "qualified";
  }
  addTimeline(lead, {
    type: "ai_message",
    title: "AI captured contact details",
    description: `${input.name} · ${input.mobile}${input.location ? ` · ${input.location}` : ""}`,
  });

  const followUpAt = new Date(Date.now() + 4 * 3_600_000).toISOString();
  lead.nextFollowUpAt = followUpAt;
  db.followUps.unshift({
    id: createId("fup"),
    customerName: lead.name,
    leadId: lead.id,
    productSlug: input.productSlug,
    reason: "incomplete_inquiry",
    reasonDetail: summaryParts.join(" "),
    channel: lead.preferredChannel,
    scheduledAt: followUpAt,
    suggestedMessage: `Hi ${lead.name.split(" ")[0]}! This is ${db.siteConfig.seller.name.split(" ")[0]} from ${db.siteConfig.storeName}. Thanks for chatting with us${product ? ` about ${product.name}` : ""}. I can confirm the total and delivery details whenever you're ready.`,
    suggestedAction: "Send friendly follow-up.",
    status: "scheduled",
    createdBy: "ai",
  });

  logActivity(db, {
    type: "captured_lead",
    customerName: lead.name,
    leadId: lead.id,
    action: isNew ? "Captured a new lead" : "Updated an existing lead",
    reasoning: `Visitor shared name and mobile${input.productSlug ? " during a product conversation" : ""}.`,
    result: `Lead score ${lead.leadScore}`,
    status: "completed",
  });
  logActivity(db, {
    type: "created_follow_up",
    customerName: lead.name,
    leadId: lead.id,
    action: "Created follow-up task",
    reasoning: "Contact captured but no order inquiry yet.",
    result: "Follow-up scheduled in 4 hours",
    status: "completed",
  });
  return lead;
}
