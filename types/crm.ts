import type { AIAnalysis, AIIntent, AIMode, ChatMessage, PurchaseIntent } from "./ai";

export type LeadSource =
  | "website_chat"
  | "facebook"
  | "messenger"
  | "instagram"
  | "tiktok"
  | "referral"
  | "order_form";

export type PipelineStage =
  | "new"
  | "engaged"
  | "qualified"
  | "interested"
  | "order_inquiry"
  | "converted"
  | "lost";

export type ContactChannel = "mobile" | "sms" | "messenger" | "email" | "viber";

export interface LeadInterest {
  productSlug: string;
  quantity?: number;
}

export type TimelineEventType =
  | "website_visit"
  | "ai_message"
  | "customer_message"
  | "seller_message"
  | "inquiry"
  | "follow_up"
  | "order"
  | "note"
  | "stage_change";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  messengerName?: string;
  location?: string;
  source: LeadSource;
  interests: LeadInterest[];
  leadScore: number;
  purchaseIntent: PurchaseIntent;
  lastIntent: AIIntent;
  stage: PipelineStage;
  preferredChannel: ContactChannel;
  objections: string[];
  aiSummary: string;
  recommendedAction: string;
  lastActivityAt: string;
  nextFollowUpAt?: string;
  assignedTo: string;
  createdAt: string;
  conversationId?: string;
  customerId?: string;
  timeline: TimelineEvent[];
  notes: string[];
}

export type CustomerStatus = "active" | "at_risk" | "inactive" | "vip";

export type ReorderLikelihood = "high" | "medium" | "low";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  messengerName?: string;
  location: string;
  status: CustomerStatus;
  preferredChannel: ContactChannel;
  favoriteProducts: string[];
  customerSince: string;
  notes: string[];
  aiInsights: string[];
  leadId?: string;
  conversationId?: string;
  reorderSnoozedUntil?: string;
}

/** Customer enriched with figures derived from their order history. */
export interface CustomerSummary extends Customer {
  lifetimeOrders: number;
  lifetimeValue: number;
  lastOrderAt?: string;
  nextReorder?: ReorderPrediction;
}

export interface ReorderPrediction {
  customerId: string;
  customerName: string;
  productSlug: string;
  lastOrderAt: string;
  typicalCycleDays: number;
  daysSinceLastOrder: number;
  daysUntilExpected: number;
  likelihood: ReorderLikelihood;
}

export type OrderStatus =
  | "inquiry"
  | "pending_confirmation"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productSlug: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  reference: string;
  customerName: string;
  customerId?: string;
  leadId?: string;
  mobile: string;
  messengerName?: string;
  email?: string;
  items: OrderItem[];
  total: number;
  deliveryLocation: string;
  paymentMethod: string;
  preferredContact: ContactChannel;
  notes?: string;
  status: OrderStatus;
  aiAssisted: boolean;
  source: LeadSource;
  createdAt: string;
  updatedAt: string;
  statusHistory: { status: OrderStatus; at: string }[];
}

export interface OrderInquiryInput {
  fullName: string;
  mobile: string;
  messengerName?: string;
  email?: string;
  productSlug: string;
  quantity: number;
  location: string;
  preferredContact: ContactChannel;
  notes?: string;
}

export type FollowUpStatus = "scheduled" | "completed" | "skipped";

export type FollowUpReason =
  | "incomplete_inquiry"
  | "product_comparison"
  | "reorder_reminder"
  | "payment_pending"
  | "post_delivery_check"
  | "price_objection"
  | "general";

export interface FollowUp {
  id: string;
  customerName: string;
  leadId?: string;
  customerId?: string;
  productSlug?: string;
  reason: FollowUpReason;
  reasonDetail: string;
  channel: ContactChannel;
  scheduledAt: string;
  suggestedMessage: string;
  suggestedAction: string;
  status: FollowUpStatus;
  createdBy: "ai" | "seller";
  completedAt?: string;
}

export interface CreateFollowUpInput {
  customerName: string;
  leadId?: string;
  customerId?: string;
  productSlug?: string;
  reason: FollowUpReason;
  reasonDetail: string;
  channel: ContactChannel;
  scheduledAt: string;
  suggestedMessage?: string;
}

export type ConversationChannel = "website" | "messenger" | "instagram" | "sms";

export type ConversationStatus = "ai_handling" | "needs_seller" | "seller_handling" | "resolved";

export interface Conversation {
  id: string;
  customerName: string;
  leadId?: string;
  customerId?: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  aiMode: AIMode;
  unread: number;
  lastMessageAt: string;
  messages: ChatMessage[];
  latestAnalysis?: AIAnalysis;
}

export interface LeadCaptureInput {
  name: string;
  mobile: string;
  location?: string;
  productSlug?: string;
  quantity?: number;
  preferredChannel?: ContactChannel;
  analysis?: AIAnalysis;
}
