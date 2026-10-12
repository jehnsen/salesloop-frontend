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

/** One slide of the homepage hero video carousel. */
export interface HeroSlide {
  id: string;
  /** Short name shown in the slide picker. */
  label: string;
  eyebrow: string;
  title: string;
  /** Second headline line, set in gold italics. */
  highlight: string;
  description: string;
  /** Self-hosted, muted background clip and the still shown before it loads. */
  video: string;
  poster: string;
  primary: { label: string; href: string };
  /** Either a link or a prompt that opens the AI assistant. */
  secondary: { label: string; href?: string; aiPrompt?: string };
}

export interface StoreFAQ {
  question: string;
  answer: string;
  group: "Ordering" | "Delivery & Payment" | "Products" | "AI Assistant";
}
