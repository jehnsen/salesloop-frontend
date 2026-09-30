import type { KnowledgeSource, NotificationSetting, SiteConfig } from "@/types";
import { daysAgo } from "./time";

export const siteConfig: SiteConfig = {
  storeName: "Luntian Wellness",
  tagline: "Everyday wellness products from your independent neighborhood reseller.",
  platformName: "SalesLoop",
  seller: {
    name: "Rhea Bautista",
    role: "Independent DXN Distributor",
    distributorId: "PH-000000 (placeholder)",
    bio: "I've been sharing coffee, beverages, and personal-care products with families around Metro Manila and Rizal since 2019. I personally confirm every order and I'm happy to answer questions. Message me anytime.",
  },
  contact: {
    mobile: "0917 000 0000",
    email: "hello@luntianwellness.example",
    messenger: "Luntian Wellness PH",
    address: "Pasig City, Metro Manila (pick-up by appointment)",
    hours: "Mon–Sat, 8:00 AM – 8:00 PM",
  },
  socials: [
    { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/" },
    { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/" },
    { platform: "tiktok", label: "TikTok", url: "https://www.tiktok.com/" },
    { platform: "messenger", label: "Messenger", url: "https://www.messenger.com/" },
  ],
  deliveryAreas: [
    "Quezon City",
    "Makati",
    "Pasig",
    "Manila",
    "Taguig",
    "Mandaluyong",
    "Marikina",
    "Caloocan",
    "Antipolo",
    "Cainta",
    "Taytay",
    "Bulacan",
  ],
  paymentMethods: [
    { id: "cod", label: "Cash on delivery (Metro Manila)", enabled: true },
    { id: "gcash", label: "GCash", enabled: true },
    { id: "maya", label: "Maya", enabled: true },
    { id: "bank", label: "Bank transfer", enabled: true },
    { id: "card", label: "Credit / debit card (coming soon)", enabled: false },
  ],
  disclaimers: {
    independentSeller:
      "Luntian Wellness is run by an independent DXN distributor. This is not the official DXN corporate website. Product names and trademarks belong to their respective owners.",
    health:
      "Products listed here are food, beverage, and personal-care products. They are not intended to diagnose, treat, cure, or prevent any disease and are not a replacement for medication. For medical concerns, consult a qualified healthcare professional.",
    ai: "AI-generated product information. For medical concerns, consult a qualified healthcare professional.",
    pricing:
      "Prices shown are reference prices. The seller confirms the final amount, availability, payment, and delivery before any order is processed.",
  },
};

export const notificationSettings: NotificationSetting[] = [
  { id: "new_lead", label: "New lead captured", description: "When the AI captures contact details.", email: true, push: true },
  { id: "high_intent", label: "High-intent customer", description: "When a lead scores 80 or above.", email: false, push: true },
  { id: "order_inquiry", label: "New order inquiry", description: "When someone submits the order form.", email: true, push: true },
  { id: "escalation", label: "Conversation escalated", description: "When the AI hands a chat to you.", email: true, push: true },
  { id: "follow_up_due", label: "Follow-ups due", description: "Morning summary of today's follow-ups.", email: true, push: false },
  { id: "reorder", label: "Reorder opportunities", description: "Weekly list of customers likely to reorder.", email: true, push: false },
];

export const knowledgeSources: KnowledgeSource[] = [
  { id: "ks_catalog", name: "Product catalog (approved fields)", type: "product_catalog", items: 14, approved: true, updatedAt: daysAgo(2) },
  { id: "ks_faq", name: "Store FAQs", type: "faq", items: 12, approved: true, updatedAt: daysAgo(6) },
  { id: "ks_delivery", name: "Delivery & payment policy", type: "policy", items: 1, approved: true, updatedAt: daysAgo(14) },
  { id: "ks_brochure", name: "Product brochure (PDF, 2025)", type: "document", items: 1, approved: false, updatedAt: daysAgo(21) },
];
