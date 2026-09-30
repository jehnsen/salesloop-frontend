export type AIIntent =
  | "general_question"
  | "product_inquiry"
  | "price_inquiry"
  | "availability_inquiry"
  | "product_comparison"
  | "buy_product"
  | "shipping_inquiry"
  | "reorder"
  | "complaint"
  | "medical_question"
  | "human_handoff"
  | "unknown";

export type PurchaseIntent = "low" | "medium" | "high";

export type AINextAction =
  | "answer_question"
  | "recommend_product"
  | "compare_products"
  | "ask_quantity"
  | "ask_location"
  | "capture_contact"
  | "create_order_inquiry"
  | "offer_reorder"
  | "escalate_to_seller"
  | "suggest_consulting_professional";

export interface AIAnalysis {
  intent: AIIntent;
  confidence: number;
  purchaseIntent: PurchaseIntent;
  /** Product slugs detected in the message or carried over from context. */
  products: string[];
  quantity?: number;
  location?: string;
  leadScore?: number;
  nextAction?: AINextAction;
  /** Health/medical question detected: the response must defer to a professional. */
  medicalFlag?: boolean;
  /** Conversation should be routed to the human seller. */
  escalate?: boolean;
  objections?: string[];
}

export type ChatRole = "customer" | "assistant" | "seller" | "system";

/** Optional rich content the assistant can attach to a message. */
export type ChatAttachment =
  | { type: "product_cards"; productSlugs: string[] }
  | { type: "comparison"; productSlugs: string[] }
  | { type: "lead_form"; productSlug?: string; quantity?: number; location?: string }
  | { type: "order_link"; productSlug?: string; quantity?: number }
  | { type: "handoff" }
  | { type: "medical_notice" };

export interface ChatMessage {
  id: string;
  role: ChatRole;
  message: string;
  timestamp: string;
  /** Internal AI metadata. Never rendered in customer-facing views. */
  analysis?: AIAnalysis;
  attachments?: ChatAttachment[];
  suggestions?: string[];
  /** Admin only: drafted by AI and awaiting seller approval. */
  isDraft?: boolean;
}

export type AIMode = "auto_reply" | "draft_only" | "human_only";

export type AIAutonomyLevel = "assist_only" | "semi_automatic" | "automatic";

export type AICapabilityId =
  | "product_qa"
  | "product_comparison"
  | "lead_capture"
  | "lead_qualification"
  | "product_recommendation"
  | "order_inquiry_assistance"
  | "follow_up_suggestions"
  | "human_handoff";

export interface AICapability {
  id: AICapabilityId;
  label: string;
  description: string;
  enabled: boolean;
}

export type AIGuardrailId =
  | "no_medical_claims"
  | "no_invented_prices"
  | "no_invented_stock"
  | "approved_knowledge_only"
  | "escalate_medical"
  | "escalate_complaints"
  | "escalate_refunds"
  | "approve_promotions";

export interface AIGuardrail {
  id: AIGuardrailId;
  label: string;
  description: string;
  enabled: boolean;
  /** Critical guardrails require confirmation before they can be switched off. */
  critical: boolean;
}

export type AIActivityType =
  | "answered_inquiry"
  | "detected_high_intent"
  | "captured_lead"
  | "created_follow_up"
  | "recommended_product"
  | "detected_reorder"
  | "escalated"
  | "drafted_message"
  | "blocked_claim";

export type AIActivityStatus = "completed" | "pending_approval" | "escalated" | "blocked";

export interface AIActivity {
  id: string;
  timestamp: string;
  type: AIActivityType;
  customerName: string;
  leadId?: string;
  customerId?: string;
  action: string;
  reasoning: string;
  result: string;
  status: AIActivityStatus;
}

export interface AIAgentConfig {
  name: string;
  active: boolean;
  autonomy: AIAutonomyLevel;
  capabilities: AICapability[];
  guardrails: AIGuardrail[];
  greeting: string;
  responseLanguage: "english" | "taglish" | "auto";
}
