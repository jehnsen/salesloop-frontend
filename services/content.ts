import type { ContentItem, ContentStatus, GenerateContentInput } from "@/types";
import { createId } from "@/lib/utils";
import { must, mutate, nowIso, query } from "./_mock";

export function getContentItems() {
  return query((db) => [...db.contentItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function updateContentStatus(id: string, status: ContentStatus) {
  return mutate((db) => {
    const item = must(db.contentItems.find((c) => c.id === id), "Content", id);
    item.status = status;
    if (status === "published" && !item.publishedAt) {
      item.publishedAt = nowIso();
      item.metrics = { reach: 0, engagements: 0, clicks: 0, leads: 0 };
    }
    return item;
  });
}

export function updateContent(id: string, patch: Partial<Pick<ContentItem, "title" | "body" | "campaignId">>) {
  return mutate((db) => {
    const item = must(db.contentItems.find((c) => c.id === id), "Content", id);
    Object.assign(item, patch);
    return item;
  });
}

export function deleteContent(id: string) {
  return mutate((db) => {
    db.contentItems = db.contentItems.filter((c) => c.id !== id);
    return id;
  });
}

const GOAL_HOOKS: Record<GenerateContentInput["goal"], string> = {
  awareness: "Have you tried",
  education: "Quick tip about",
  promotion: "This week only: ask us about",
  reorder: "Running low on",
};

/**
 * Mock "Generate Content". Produces a compliant draft from approved product
 * fields only (no health claims). Replace with an LLM call later.
 */
export function generateContent(input: GenerateContentInput) {
  return mutate((db) => {
    const product = must(db.products.find((p) => p.slug === input.productSlug), "Product", input.productSlug);
    const hook = `${GOAL_HOOKS[input.goal]} ${product.name}?`;
    const cta = `Message us or ask our AI assistant to send an order inquiry. 🌿`;
    const bodies: Record<GenerateContentInput["platform"], string> = {
      facebook: `${hook}\n\n${product.summary}\n\n☕ ${product.unit}\n📍 Delivery around Metro Manila, Rizal & Bulacan\n\n${cta}`,
      instagram: `${hook} ✨\n${product.summary}\n\n#everydaywellness #${product.category.replace("-", "")} #LuntianWellness`,
      tiktok: `HOOK (0–3s): "${hook}"\nSCENE 1: Show the ${product.unit.toLowerCase()}.\nSCENE 2: ${product.preparation.split(".")[0]}.\nSCENE 3: Taste reaction.\nCTA: "Ask our AI assistant which one fits your routine!"`,
      blog: `Title idea: Getting to know ${product.name}\nOutline:\n1. What it is\n2. How to prepare it\n3. Storage tips\n4. How to order\n\nNote: stick to label information only.`,
      messenger_broadcast: `Hi {first_name}! ${hook} ${product.summary} Reply ORDER and I'll prepare it for you. Salamat!`,
      educational: `Carousel: "${product.name} 101"\nSlide 1: What's inside: ${product.ingredients.join(", ")}\nSlide 2: How to prepare\nSlide 3: How to store\nSlide 4: Questions? Ask our AI assistant`,
    };
    const item: ContentItem = {
      id: createId("cnt"),
      title: `${hook.replace("?", "")}`,
      platform: input.platform,
      campaignId: input.campaignId,
      status: "draft",
      body: bodies[input.platform],
      createdAt: nowIso(),
      aiGenerated: true,
    };
    db.contentItems.unshift(item);
    return item;
  }, 1200);
}
