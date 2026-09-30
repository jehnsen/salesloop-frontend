import { blogPosts, storeFaqs, testimonials } from "@/lib/mock-data/content";

/** Read-only marketing content for the customer site. */

export async function getBlogPosts(limit?: number) {
  const sorted = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return structuredClone(limit ? sorted.slice(0, limit) : sorted);
}

export async function getBlogPostBySlug(slug: string) {
  return structuredClone(blogPosts.find((p) => p.slug === slug) ?? null);
}

export async function getRelatedPosts(slug: string, limit = 3) {
  const current = blogPosts.find((p) => p.slug === slug);
  const others = blogPosts.filter((p) => p.slug !== slug);
  const sameCategory = others.filter((p) => p.category === current?.category);
  return structuredClone([...sameCategory, ...others.filter((p) => p.category !== current?.category)].slice(0, limit));
}

export async function getTestimonials() {
  return structuredClone(testimonials);
}

export async function getStoreFaqs() {
  return structuredClone(storeFaqs);
}
