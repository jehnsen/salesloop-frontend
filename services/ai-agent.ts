import type {
  AIActivity,
  AIAgentConfig,
  AIAnalysis,
  AICapabilityId,
  AIGuardrailId,
  ChatMessage,
  ContactChannel,
} from "@/types";
import type { MockDatabase } from "@/lib/mock-data/store";
import {
  composeReply,
  detectMobile,
  productContextGreeting,
  type ChatSessionState,
  type EngineContext,
} from "@/lib/ai/mock-engine";
import { REVENUE_STATUSES } from "@/lib/constants";
import { createId } from "@/lib/utils";
import { mutate, nowIso, query } from "./_mock";
import { findCustomerByMobileSync, logActivity } from "./_records";
import { upsertWebConversation, webConversationId } from "./conversations";
import { captureLeadInDb } from "./leads";

export type { ChatSessionState } from "@/lib/ai/mock-engine";
export { initialSessionState } from "@/lib/ai/mock-engine";

// --- Configuration -----------------------------------------------------------

export function getAgentConfig() {
  return query((db) => db.aiAgentConfig);
}

export function updateAgentConfig(patch: Partial<Omit<AIAgentConfig, "capabilities" | "guardrails">>) {
  return mutate((db) => Object.assign(db.aiAgentConfig, patch), 200);
}

export function setCapability(id: AICapabilityId, enabled: boolean) {
  return mutate((db) => {
    const cap = db.aiAgentConfig.capabilities.find((c) => c.id === id);
    if (cap) cap.enabled = enabled;
    return db.aiAgentConfig;
  }, 150);
}

export function setGuardrail(id: AIGuardrailId, enabled: boolean) {
  return mutate((db) => {
    const rule = db.aiAgentConfig.guardrails.find((g) => g.id === id);
    if (rule) rule.enabled = enabled;
    return db.aiAgentConfig;
  }, 150);
}

export function getAIActivity(options: { limit?: number; type?: AIActivity["type"] | "all" } = {}) {
  return query((db) => {
    const list = db.aiActivity
      .filter((a) => !options.type || options.type === "all" || a.type === options.type)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return options.limit ? list.slice(0, options.limit) : list;
  });
}

// --- Customer chat -----------------------------------------------------------

export interface CustomerChatResult {
  /** Customer-safe assistant message (no analysis attached). */
  reply: ChatMessage;
  state: ChatSessionState;
  /** Internal analysis of the customer's message, for the dev inspector only. */
  analysis: AIAnalysis;
  agentActive: boolean;
}

function engineContext(db: MockDatabase): EngineContext {
  return { products: db.products, config: db.aiAgentConfig, site: db.siteConfig };
}

function lastOrderOf(db: MockDatabase, customerId: string) {
  const order = db.orders
    .filter((o) => o.customerId === customerId && REVENUE_STATUSES.includes(o.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const item = order?.items[0];
  return item ? { productSlug: item.productSlug, quantity: item.quantity } : undefined;
}

function message(role: ChatMessage["role"], text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id: createId("msg"), role, message: text, timestamp: nowIso(), ...extra };
}

export function getAgentStatus() {
  return query((db) => ({ active: db.aiAgentConfig.active, greeting: db.aiAgentConfig.greeting }), 0);
}

export function getProductGreeting(productSlug: string) {
  return query((db) => {
    const product = db.products.find((p) => p.slug === productSlug && p.approvedForAI && !p.archived);
    return product ? productContextGreeting(product) : null;
  }, 0);
}

/**
 * Sends a customer message to the (mock) AI Sales Agent.
 * Mirrors the conversation into the admin inbox, auto-captures leads when a
 * mobile number is shared, and logs AI activity.
 */
export function sendCustomerMessage(sessionId: string, text: string, state: ChatSessionState) {
  return mutate<CustomerChatResult>((db) => {
    const customerMessage = message("customer", text);

    if (!db.aiAgentConfig.active) {
      const reply = message(
        "assistant",
        `Our AI assistant is offline right now, but your message has been sent to ${db.siteConfig.seller.name}. You can also reach us on Messenger (${db.siteConfig.contact.messenger}) or at ${db.siteConfig.contact.mobile}.`,
        { attachments: [{ type: "handoff" }] },
      );
      upsertWebConversation(db, sessionId, [customerMessage, reply], { escalate: true });
      return {
        reply,
        state,
        analysis: { intent: "unknown", confidence: 0, purchaseIntent: "low", products: [] },
        agentActive: false,
      };
    }

    const mobile = detectMobile(text) ?? state.mobile;
    const known = mobile ? findCustomerByMobileSync(db, mobile) : undefined;
    const ctx: EngineContext = {
      ...engineContext(db),
      knownCustomer: known ? { ...known, lastOrder: lastOrderOf(db, known.id) } : undefined,
    };
    const result = composeReply(text, state, ctx);
    const next = { ...result.state };
    customerMessage.analysis = result.analysis;

    // Auto-capture: the visitor typed a mobile number (and ideally a name) in the chat.
    let leadId = next.leadId;
    if (!next.leadCaptured && next.mobile && (next.name || known)) {
      const lead = captureLeadInDb(db, {
        name: next.name ?? known?.name ?? "Website visitor",
        mobile: next.mobile,
        location: next.location,
        productSlug: next.productSlug,
        quantity: next.quantity,
        analysis: result.analysis,
        conversationId: webConversationId(sessionId),
      });
      next.leadCaptured = true;
      next.leadId = leadId = lead.id;
    }
    if (known) next.returningCustomerId = known.id;

    const reply = message("assistant", result.message, {
      attachments: result.attachments,
      suggestions: result.suggestions,
    });

    const extra: ChatMessage[] = [];
    const customerName = next.name ?? known?.name;
    const a = result.analysis;
    if (a.escalate) {
      extra.push(message("system", a.medicalFlag ? "Health-related question detected. Conversation escalated to seller." : "Conversation escalated to seller."));
      logActivity(db, {
        type: a.medicalFlag ? "blocked_claim" : "escalated",
        customerName: customerName ?? "Website visitor",
        leadId,
        customerId: known?.id,
        action: a.medicalFlag ? "Referred to healthcare professional" : "Escalated conversation to seller",
        reasoning: a.medicalFlag
          ? "Medical guardrail: the AI does not give medical advice."
          : `Intent "${a.intent}" requires human handling.`,
        result: "Seller notified",
        status: "escalated",
      });
    } else if (a.purchaseIntent === "high" && state.leadScore < 70 && (a.leadScore ?? 0) >= 70) {
      logActivity(db, {
        type: "detected_high_intent",
        customerName: customerName ?? "Website visitor",
        leadId,
        action: "Detected high purchase intent",
        reasoning: [a.quantity && `quantity ${a.quantity}`, a.location && `location ${a.location}`, a.products[0]]
          .filter(Boolean)
          .join(", "),
        result: `Lead score ${a.leadScore}`,
        status: "completed",
      });
    } else if (a.nextAction === "recommend_product" && result.attachments.some((x) => x.type === "product_cards")) {
      logActivity(db, {
        type: "recommended_product",
        customerName: customerName ?? "Website visitor",
        leadId,
        action: "Recommended products",
        reasoning: `Customer message: "${text.slice(0, 60)}"`,
        result: "Product suggestions shown",
        status: "completed",
      });
    } else if (a.intent === "reorder") {
      logActivity(db, {
        type: "detected_reorder",
        customerName: customerName ?? "Website visitor",
        customerId: known?.id,
        action: "Detected reorder request",
        reasoning: known ? "Matched an existing customer by mobile number." : "Customer mentioned reordering.",
        result: "Reorder flow started",
        status: "completed",
      });
    }

    upsertWebConversation(db, sessionId, [customerMessage, reply, ...extra], {
      customerName,
      leadId,
      customerId: known?.id,
      analysis: a,
      escalate: a.escalate,
    });

    return { reply, state: next, analysis: a, agentActive: true };
  }, 700 + Math.round(Math.random() * 600));
}

/** Submitted from the inline lead form inside the chat. */
export function submitChatLeadForm(
  sessionId: string,
  form: { name: string; mobile: string; preferredChannel: ContactChannel },
  state: ChatSessionState,
) {
  return mutate<{ reply: ChatMessage; state: ChatSessionState }>((db) => {
    const known = findCustomerByMobileSync(db, form.mobile);
    const lead = captureLeadInDb(db, {
      name: form.name,
      mobile: form.mobile,
      location: state.location,
      productSlug: state.productSlug,
      quantity: state.quantity,
      preferredChannel: form.preferredChannel,
      conversationId: webConversationId(sessionId),
      analysis: { intent: "buy_product", confidence: 0.9, purchaseIntent: "high", products: state.productSlug ? [state.productSlug] : [], leadScore: Math.max(state.leadScore, 75) },
    });
    const next: ChatSessionState = {
      ...state,
      name: form.name,
      mobile: form.mobile,
      leadCaptured: true,
      leadId: lead.id,
      returningCustomerId: known?.id,
    };
    const first = form.name.split(" ")[0];
    const product = db.products.find((p) => p.slug === state.productSlug);
    const seller = db.siteConfig.seller.name.split(" ")[0];

    let text: string;
    let orderLink: { productSlug?: string; quantity?: number } | undefined = { productSlug: state.productSlug, quantity: state.quantity };
    if (known) {
      const last = lastOrderOf(db, known.id);
      const lastProduct = db.products.find((p) => p.slug === last?.productSlug);
      text = `Welcome back, ${first}! ${lastProduct && last ? `Your last order was ${last.quantity} × ${lastProduct.name}. ` : ""}I've passed your details to ${seller}, who will confirm availability, the total amount, and delivery.`;
      if (!state.productSlug && last) orderLink = last;
      logActivity(db, {
        type: "detected_reorder",
        customerName: known.name,
        customerId: known.id,
        action: "Recognized a returning customer",
        reasoning: "Mobile number matches an existing customer.",
        result: "Reorder details prepared for seller",
        status: "completed",
      });
    } else {
      text = `Thanks, ${first}! I've passed your details to ${seller}, who will confirm availability, the total amount, payment, and delivery${form.preferredChannel === "messenger" ? " via Messenger" : ""}.`;
    }
    text += product || orderLink?.productSlug ? " You can also send a formal order inquiry now so it's ready for confirmation." : "";

    const reply = message("assistant", text, {
      attachments: orderLink?.productSlug ? [{ type: "order_link", ...orderLink }] : [],
      suggestions: ["Recommend another product", "How do I order?"],
    });
    upsertWebConversation(db, sessionId, [message("system", `Lead captured: ${form.name} · ${form.mobile}`), reply], {
      customerName: form.name,
      leadId: lead.id,
      customerId: known?.id,
    });
    return { reply, state: next };
  }, 600);
}
