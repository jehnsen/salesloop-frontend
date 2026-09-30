import type { AIAnalysis, AIMode, ChatMessage, Conversation, ConversationStatus } from "@/types";
import type { MockDatabase } from "@/lib/mock-data/store";
import { composeReply, initialSessionState, type ChatSessionState } from "@/lib/ai/mock-engine";
import { createId } from "@/lib/utils";
import { must, mutate, nowIso, query } from "./_mock";
import { logActivity } from "./_records";

export function getConversations() {
  return query((db) => [...db.conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)));
}

export function getRecentConversations(limit = 5) {
  return query((db) => [...db.conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)).slice(0, limit));
}

export function getConversationById(id: string) {
  return query((db) => db.conversations.find((c) => c.id === id) ?? null);
}

export function markConversationRead(id: string) {
  return mutate((db) => {
    const c = must(db.conversations.find((x) => x.id === id), "Conversation", id);
    c.unread = 0;
    return c;
  }, 0);
}

export function setConversationMode(id: string, aiMode: AIMode) {
  return mutate((db) => {
    const c = must(db.conversations.find((x) => x.id === id), "Conversation", id);
    c.aiMode = aiMode;
    if (aiMode === "human_only" && c.status === "ai_handling") c.status = "seller_handling";
    if (aiMode === "auto_reply" && c.status === "seller_handling") c.status = "ai_handling";
    c.messages.push(systemMessage(`AI mode changed to ${aiMode.replace("_", " ")}.`));
    return c;
  }, 150);
}

export function setConversationStatus(id: string, status: ConversationStatus) {
  return mutate((db) => {
    const c = must(db.conversations.find((x) => x.id === id), "Conversation", id);
    c.status = status;
    return c;
  }, 150);
}

export function sendSellerMessage(id: string, text: string) {
  return mutate((db) => {
    const c = must(db.conversations.find((x) => x.id === id), "Conversation", id);
    const message: ChatMessage = { id: createId("msg"), role: "seller", message: text, timestamp: nowIso() };
    c.messages = c.messages.filter((m) => !m.isDraft);
    c.messages.push(message);
    c.lastMessageAt = message.timestamp;
    if (c.status !== "resolved") c.status = "seller_handling";
    return c;
  });
}

/** Asks the (mock) AI to draft a reply to the latest customer message. */
export function generateDraftReply(id: string) {
  return mutate((db) => {
    const c = must(db.conversations.find((x) => x.id === id), "Conversation", id);
    const lastCustomer = [...c.messages].reverse().find((m) => m.role === "customer");
    const state: ChatSessionState = {
      ...initialSessionState,
      productSlug: c.latestAnalysis?.products[0],
      quantity: c.latestAnalysis?.quantity,
      location: c.latestAnalysis?.location,
      leadScore: c.latestAnalysis?.leadScore ?? initialSessionState.leadScore,
      leadCaptured: Boolean(c.leadId || c.customerId),
    };
    const reply = lastCustomer
      ? composeReply(lastCustomer.message, state, { products: db.products, config: db.aiAgentConfig, site: db.siteConfig })
      : null;
    const draft: ChatMessage = {
      id: createId("msg"),
      role: "assistant",
      message: reply?.message ?? `Hi ${c.customerName.split(" ")[0]}! Just checking in. Is there anything else I can help you with?`,
      timestamp: nowIso(),
      isDraft: true,
    };
    c.messages = c.messages.filter((m) => !m.isDraft);
    c.messages.push(draft);
    logActivity(db, {
      type: "drafted_message",
      customerName: c.customerName,
      leadId: c.leadId,
      customerId: c.customerId,
      action: "Drafted a reply",
      reasoning: reply ? `Responding to: "${lastCustomer?.message.slice(0, 60)}"` : "No recent customer message; drafted a check-in.",
      result: "Waiting for seller approval",
      status: "pending_approval",
    });
    return c;
  }, 900);
}

export function approveDraft(conversationId: string, messageId: string, editedText?: string) {
  return mutate((db) => {
    const c = must(db.conversations.find((x) => x.id === conversationId), "Conversation", conversationId);
    const draft = must(c.messages.find((m) => m.id === messageId && m.isDraft), "Draft", messageId);
    draft.isDraft = false;
    draft.message = editedText?.trim() || draft.message;
    draft.timestamp = nowIso();
    c.lastMessageAt = draft.timestamp;
    return c;
  });
}

export function discardDraft(conversationId: string, messageId: string) {
  return mutate((db) => {
    const c = must(db.conversations.find((x) => x.id === conversationId), "Conversation", conversationId);
    c.messages = c.messages.filter((m) => m.id !== messageId);
    return c;
  }, 100);
}

function systemMessage(text: string): ChatMessage {
  return { id: createId("msg"), role: "system", message: text, timestamp: nowIso() };
}

// --- Website chat bridge ----------------------------------------------------

export function webConversationId(sessionId: string) {
  return `web_${sessionId}`;
}

/** Internal: mirrors the customer's website chat into the admin inbox. */
export function upsertWebConversation(
  db: MockDatabase,
  sessionId: string,
  messages: ChatMessage[],
  meta: { customerName?: string; leadId?: string; customerId?: string; analysis?: AIAnalysis; escalate?: boolean },
): Conversation {
  const id = webConversationId(sessionId);
  let c = db.conversations.find((x) => x.id === id);
  if (!c) {
    c = {
      id,
      customerName: meta.customerName ?? "Website visitor",
      channel: "website",
      status: "ai_handling",
      aiMode: "auto_reply",
      unread: 0,
      lastMessageAt: nowIso(),
      messages: [],
    };
    db.conversations.unshift(c);
  }
  c.messages.push(...messages);
  c.lastMessageAt = messages.at(-1)?.timestamp ?? c.lastMessageAt;
  c.unread += messages.filter((m) => m.role === "customer").length;
  if (meta.customerName) c.customerName = meta.customerName;
  if (meta.leadId) c.leadId = meta.leadId;
  if (meta.customerId) c.customerId = meta.customerId;
  if (meta.analysis) c.latestAnalysis = meta.analysis;
  if (meta.escalate) c.status = "needs_seller";
  return c;
}
