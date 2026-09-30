import type { CategoryValue } from "@/types";
import { MOCK_NOW } from "./time";

export interface DailyMetrics {
  date: string;
  visitors: number;
  conversations: number;
  leads: number;
  qualified: number;
  inquiries: number;
  orders: number;
  revenue: number;
  aiRevenue: number;
  aiOrders: number;
  repeatOrders: number;
}

/** Small deterministic PRNG so server and client generate identical series. */
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const DAYS = 180;
const DAY_MS = 86_400_000;

function generateDaily(): DailyMetrics[] {
  const rand = mulberry32(20260930);
  const start = MOCK_NOW - (DAYS - 1) * DAY_MS;
  return Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(start + i * DAY_MS);
    const weekday = date.getUTCDay();
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.18 : 1;
    // Gentle growth over the period; the AI assistant was switched on ~day 60.
    const growth = 0.7 + (i / DAYS) * 0.6;
    const aiShare = i < 60 ? 0.12 : Math.min(0.62, 0.3 + (i - 60) / 400);
    const noise = () => 0.85 + rand() * 0.3;

    const visitors = Math.round(58 * growth * weekendBoost * noise());
    const conversations = Math.round(visitors * (0.13 + aiShare * 0.08) * noise());
    const leads = Math.max(1, Math.round(conversations * 0.42 * noise()));
    const qualified = Math.round(leads * 0.58 * noise());
    const inquiries = Math.round(qualified * 0.66 * noise());
    const orders = Math.max(0, Math.round(inquiries * 0.78 * noise()));
    const avgOrder = 1150 + rand() * 450;
    const revenue = Math.round(orders * avgOrder);
    const aiOrders = Math.round(orders * aiShare);
    const aiRevenue = Math.round(aiOrders * avgOrder);
    const repeatOrders = Math.round(orders * (0.36 + rand() * 0.14));
    return {
      date: date.toISOString().slice(0, 10),
      visitors,
      conversations,
      leads,
      qualified,
      inquiries,
      orders,
      revenue,
      aiRevenue,
      aiOrders,
      repeatOrders,
    };
  });
}

export const dailyMetrics: DailyMetrics[] = generateDaily();

/** Share of leads by source, used to split lead totals in reports. */
export const leadSourceWeights: { source: string; weight: number; conversion: number }[] = [
  { source: "Website AI Chat", weight: 0.36, conversion: 0.31 },
  { source: "Facebook", weight: 0.24, conversion: 0.22 },
  { source: "Messenger", weight: 0.18, conversion: 0.34 },
  { source: "Instagram", weight: 0.09, conversion: 0.16 },
  { source: "TikTok", weight: 0.08, conversion: 0.11 },
  { source: "Referral", weight: 0.05, conversion: 0.45 },
];

export const productInterestWeights: CategoryValue[] = [
  { name: "Lingzhi Coffee 3-in-1", value: 0.27 },
  { name: "Lingzhi Black Coffee", value: 0.18 },
  { name: "White Coffee Zhino", value: 0.13 },
  { name: "Cocozhi Cocoa Drink", value: 0.12 },
  { name: "Spirulina Tablets", value: 0.1 },
  { name: "RG / GL Capsules", value: 0.09 },
  { name: "Personal Care", value: 0.07 },
  { name: "Other", value: 0.04 },
];

export const followUpOutcomeWeights: CategoryValue[] = [
  { name: "Reorder reminder", value: 0.48 },
  { name: "Incomplete inquiry", value: 0.34 },
  { name: "Product comparison", value: 0.27 },
  { name: "Payment pending", value: 0.61 },
  { name: "Price concern", value: 0.14 },
];
