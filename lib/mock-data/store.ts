import type {
  AIActivity,
  AIAgentConfig,
  Campaign,
  ContentItem,
  Conversation,
  Customer,
  FollowUp,
  KnowledgeSource,
  Lead,
  NotificationSetting,
  Order,
  Product,
  SiteConfig,
} from "@/types";
import { aiActivity, aiAgentConfig } from "./ai-agent";
import { conversations } from "./conversations";
import { customers } from "./customers";
import { followUps } from "./followups";
import { leads } from "./leads";
import { campaigns, contentItems } from "./marketing";
import { orders } from "./orders";
import { products } from "./products";
import { knowledgeSources, notificationSettings, siteConfig } from "./site";

/**
 * In-memory mock database used by `/services`.
 *
 * - On the server it is seeded once per process and is read-only in practice.
 * - In the browser, writes are persisted to localStorage so a lead captured in the
 *   customer chat shows up in the admin CRM in the same browser.
 *
 * When the real API is connected, `/services` will call it instead and this file goes away.
 */
export interface MockDatabase {
  products: Product[];
  leads: Lead[];
  customers: Customer[];
  orders: Order[];
  followUps: FollowUp[];
  conversations: Conversation[];
  aiActivity: AIActivity[];
  aiAgentConfig: AIAgentConfig;
  campaigns: Campaign[];
  contentItems: ContentItem[];
  siteConfig: SiteConfig;
  notificationSettings: NotificationSetting[];
  knowledgeSources: KnowledgeSource[];
}

const STORAGE_KEY = "salesloop-mock-db-v1";

function createSeed(): MockDatabase {
  return structuredClone({
    products,
    leads,
    customers,
    orders,
    followUps,
    conversations,
    aiActivity,
    aiAgentConfig,
    campaigns,
    contentItems,
    siteConfig,
    notificationSettings,
    knowledgeSources,
  });
}

let db: MockDatabase | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

// Another tab (e.g. customer site vs admin) wrote new data: drop our cached copy.
if (isBrowser()) {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) db = null;
  });
}

function loadPersisted(): MockDatabase | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockDatabase) : null;
  } catch {
    return null;
  }
}

export function getDb(): MockDatabase {
  if (!db) db = loadPersisted() ?? createSeed();
  return db;
}

export function persistDb() {
  if (!isBrowser() || !db) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent("salesloop:db-change"));
  } catch {
    // Storage full or blocked (private mode). The in-memory copy still works.
  }
}

export function resetDb() {
  db = createSeed();
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("salesloop:db-change"));
  }
}
