import type { Customer, Order, Product, ReorderLikelihood, ReorderPrediction } from "@/types";
import { REVENUE_STATUSES } from "@/lib/constants";

const DAY = 86_400_000;

/**
 * Mock predictive logic for repeat orders.
 *
 * For the customer's most-ordered product we average the gap between past orders
 * (or fall back to the product's typical reorder cycle) and compare it with the
 * days since their last order. A real model can replace this later.
 */
export function predictReorder(
  customer: Customer,
  orders: Order[],
  products: Product[],
  now = Date.now(),
): ReorderPrediction | undefined {
  const completed = orders
    .filter((o) => o.customerId === customer.id && REVENUE_STATUSES.includes(o.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (!completed.length) return undefined;

  const counts = new Map<string, number>();
  for (const order of completed) {
    for (const item of order.items) counts.set(item.productSlug, (counts.get(item.productSlug) ?? 0) + 1);
  }
  const [productSlug] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const productOrders = completed.filter((o) => o.items.some((i) => i.productSlug === productSlug));
  const last = productOrders[productOrders.length - 1];

  let cycle = products.find((p) => p.slug === productSlug)?.typicalReorderDays ?? 30;
  if (productOrders.length > 1) {
    const gaps = productOrders
      .slice(1)
      .map((o, i) => (new Date(o.createdAt).getTime() - new Date(productOrders[i].createdAt).getTime()) / DAY);
    cycle = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }

  const daysSince = Math.floor((now - new Date(last.createdAt).getTime()) / DAY);
  const ratio = daysSince / cycle;
  let likelihood: ReorderLikelihood = "low";
  if (ratio >= 0.8 && ratio <= 1.3) likelihood = "high";
  else if ((ratio >= 0.6 && ratio < 0.8) || (ratio > 1.3 && ratio <= 2)) likelihood = "medium";

  return {
    customerId: customer.id,
    customerName: customer.name,
    productSlug,
    lastOrderAt: last.createdAt,
    typicalCycleDays: cycle,
    daysSinceLastOrder: daysSince,
    daysUntilExpected: cycle - daysSince,
    likelihood,
  };
}

export const LIKELIHOOD_RANK: Record<ReorderLikelihood, number> = { high: 0, medium: 1, low: 2 };
