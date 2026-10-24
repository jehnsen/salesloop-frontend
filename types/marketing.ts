import type { ProductTone } from "./product";

export type ContentPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "blog"
  | "messenger_broadcast"
  | "educational";

export type ContentStatus = "idea" | "draft" | "approved" | "published";

export interface ContentMetrics {
  reach: number;
  engagements: number;
  clicks: number;
  leads: number;
}

export interface ContentItem {
  id: string;
  title: string;
  platform: ContentPlatform;
  campaignId?: string;
  status: ContentStatus;
  body: string;
  createdAt: string;
  publishedAt?: string;
  aiGenerated: boolean;
  metrics?: ContentMetrics;
}

export interface GenerateContentInput {
  platform: ContentPlatform;
  productSlug: string;
  goal: "awareness" | "education" | "promotion" | "reorder";
  campaignId?: string;
}

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface CampaignFunnel {
  impressions: number;
  visits: number;
  conversations: number;
  leads: number;
  orders: number;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  productSlugs: string[];
  targetAudience: string;
  channels: ContentPlatform[];
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  funnel: CampaignFunnel;
  estimatedRevenue: number;
}

export interface BlogBlock {
  type: "h2" | "p" | "list" | "note";
  text?: string;
  items?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  readingMinutes: number;
  tone: ProductTone;
  image?: string;
  content: BlogBlock[];
  relatedProductSlugs: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
  productSlug?: string;
}

/** One slide of the homepage hero image carousel. The headline and button are part of the artwork. */
export interface HeroSlide {
  id: string;
  /** Short name used by the slide picker and screen readers. */
  label: string;
  /** Banner artwork in /public. */
  image: string;
  /** What the banner says, for screen readers (the text is drawn into the image). */
  alt: string;
  /** Where the whole banner links to. */
  href: string;
  /** CSS object-position that keeps the artwork's text in frame when it is cropped: phones, then wider screens. */
  focus: { mobile: string; desktop: string };
}

export interface StoreFAQ {
  question: string;
  answer: string;
  group: "Ordering" | "Delivery & Payment" | "Products" | "AI Assistant";
}
