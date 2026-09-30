import type {
  AIActivityType,
  AIIntent,
  AIMode,
  AINextAction,
  CampaignStatus,
  ContactChannel,
  ContentPlatform,
  ContentStatus,
  ConversationChannel,
  ConversationStatus,
  CustomerStatus,
  FollowUpReason,
  LeadSource,
  OrderStatus,
  PipelineStage,
  StockStatus,
} from "@/types";

/** Human-readable labels for every enum shown in the UI. Keep them here, not in components. */

export const PIPELINE_STAGES: { id: PipelineStage; label: string; description: string }[] = [
  { id: "new", label: "New", description: "Just arrived, not yet engaged" },
  { id: "engaged", label: "Engaged", description: "Actively chatting or asking questions" },
  { id: "qualified", label: "Qualified", description: "Has a real need, contact details captured" },
  { id: "interested", label: "Interested", description: "Specific product and quantity in mind" },
  { id: "order_inquiry", label: "Order Inquiry", description: "Sent an order inquiry" },
  { id: "converted", label: "Converted", description: "Became a paying customer" },
  { id: "lost", label: "Lost", description: "No longer pursuing" },
];

export const STAGE_LABEL = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, s.label])) as Record<
  PipelineStage,
  string
>;

export const ORDER_STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "inquiry", label: "Inquiry" },
  { id: "pending_confirmation", label: "Pending Confirmation" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready_for_delivery", label: "Ready for Delivery" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export const ORDER_STATUS_LABEL = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, s.label])) as Record<
  OrderStatus,
  string
>;

/** Revenue only counts once an order has been confirmed by the seller. */
export const REVENUE_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "ready_for_delivery",
  "shipped",
  "delivered",
];

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  website_chat: "Website AI Chat",
  facebook: "Facebook",
  messenger: "Messenger",
  instagram: "Instagram",
  tiktok: "TikTok",
  referral: "Referral",
  order_form: "Order Form",
};

export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  mobile: "Mobile call",
  sms: "SMS",
  messenger: "Messenger",
  email: "Email",
  viber: "Viber",
};

export const INTENT_LABEL: Record<AIIntent, string> = {
  general_question: "General question",
  product_inquiry: "Product inquiry",
  price_inquiry: "Price inquiry",
  availability_inquiry: "Availability",
  product_comparison: "Comparison",
  buy_product: "Wants to buy",
  shipping_inquiry: "Delivery inquiry",
  reorder: "Reorder",
  complaint: "Complaint",
  medical_question: "Health question",
  human_handoff: "Wants seller",
  unknown: "Unclear",
};

export const NEXT_ACTION_LABEL: Record<AINextAction, string> = {
  answer_question: "Answer question",
  recommend_product: "Recommend a product",
  compare_products: "Compare products",
  ask_quantity: "Ask quantity",
  ask_location: "Ask location",
  capture_contact: "Capture contact details",
  create_order_inquiry: "Create order inquiry",
  offer_reorder: "Offer reorder",
  escalate_to_seller: "Escalate to seller",
  suggest_consulting_professional: "Refer to healthcare professional",
};

export const STOCK_LABEL: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  pre_order: "Pre-order",
};

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  active: "Active",
  vip: "Loyal",
  at_risk: "At risk",
  inactive: "Inactive",
};

export const FOLLOW_UP_REASON_LABEL: Record<FollowUpReason, string> = {
  incomplete_inquiry: "Incomplete inquiry",
  product_comparison: "Product comparison",
  reorder_reminder: "Reorder reminder",
  payment_pending: "Payment pending",
  post_delivery_check: "Post-delivery check-in",
  price_objection: "Price concern",
  general: "General follow-up",
};

export const CONVERSATION_CHANNEL_LABEL: Record<ConversationChannel, string> = {
  website: "Website chat",
  messenger: "Messenger",
  instagram: "Instagram",
  sms: "SMS",
};

export const CONVERSATION_STATUS_LABEL: Record<ConversationStatus, string> = {
  ai_handling: "AI handling",
  needs_seller: "Needs seller",
  seller_handling: "Seller handling",
  resolved: "Resolved",
};

export const AI_MODE_OPTIONS: { id: AIMode; label: string; description: string }[] = [
  { id: "auto_reply", label: "Auto Reply", description: "AI replies to simple questions automatically." },
  { id: "draft_only", label: "Draft Only", description: "AI drafts replies. You approve before sending." },
  { id: "human_only", label: "Human Only", description: "AI stays quiet. You handle the conversation." },
];

export const CONTENT_PLATFORM_LABEL: Record<ContentPlatform, string> = {
  facebook: "Facebook post",
  instagram: "Instagram caption",
  tiktok: "TikTok script",
  blog: "Blog post",
  messenger_broadcast: "Promo message",
  educational: "Educational",
};

export const CONTENT_STATUSES: { id: ContentStatus; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "draft", label: "Draft" },
  { id: "approved", label: "Approved" },
  { id: "published", label: "Published" },
];

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export const AI_ACTIVITY_LABEL: Record<AIActivityType, string> = {
  answered_inquiry: "Answered product inquiry",
  detected_high_intent: "Detected high purchase intent",
  captured_lead: "Captured a new lead",
  created_follow_up: "Created follow-up task",
  recommended_product: "Recommended a product",
  detected_reorder: "Detected reorder opportunity",
  escalated: "Escalated to seller",
  drafted_message: "Drafted a reply",
  blocked_claim: "Blocked a non-compliant reply",
};

export const PH_LOCATIONS = [
  "Quezon City",
  "Makati",
  "Pasig",
  "Manila",
  "Taguig",
  "Mandaluyong",
  "Marikina",
  "San Juan",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Caloocan",
  "Valenzuela",
  "Malabon",
  "Navotas",
  "Pasay",
  "Antipolo",
  "Cainta",
  "Taytay",
  "San Mateo",
  "Rodriguez",
  "Bulacan",
  "Malolos",
  "Meycauayan",
  "Marilao",
  "Cavite",
  "Bacoor",
  "Imus",
  "Laguna",
  "Santa Rosa",
  "Calamba",
  "Cebu City",
  "Davao City",
];

export const MEDICAL_ADVICE_NOTICE =
  "Please consult a qualified healthcare professional for medical advice.";
