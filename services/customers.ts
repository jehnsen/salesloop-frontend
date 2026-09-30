import type { Customer, CustomerSummary, Order, ReorderPrediction } from "@/types";
import type { MockDatabase } from "@/lib/mock-data/store";
import { REVENUE_STATUSES } from "@/lib/constants";
import { LIKELIHOOD_RANK, predictReorder } from "@/lib/ai/reorder";
import { must, mutate, query } from "./_mock";
import { findCustomerByMobileSync } from "./_records";

function summarize(db: MockDatabase, customer: Customer): CustomerSummary {
  const orders = db.orders.filter((o) => o.customerId === customer.id && REVENUE_STATUSES.includes(o.status));
  const lastOrderAt = orders.map((o) => o.createdAt).sort().at(-1);
  return {
    ...customer,
    lifetimeOrders: orders.length,
    lifetimeValue: orders.reduce((sum, o) => sum + o.total, 0),
    lastOrderAt,
    nextReorder: predictReorder(customer, db.orders, db.products),
  };
}

export function getCustomers() {
  return query((db) =>
    db.customers
      .map((c) => summarize(db, c))
      .sort((a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? "")),
  );
}

export interface CustomerDetail {
  customer: CustomerSummary;
  orders: Order[];
}

export function getCustomerById(id: string) {
  return query<CustomerDetail | null>((db) => {
    const customer = db.customers.find((c) => c.id === id);
    if (!customer) return null;
    return {
      customer: summarize(db, customer),
      orders: db.orders.filter((o) => o.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  });
}

/** Customers likely to reorder soon, ordered by likelihood then urgency. Snoozed customers are hidden. */
export function getReorderOpportunities(limit?: number) {
  return query<ReorderPrediction[]>((db) => {
    const now = Date.now();
    const list = db.customers
      .filter((c) => !c.reorderSnoozedUntil || new Date(c.reorderSnoozedUntil).getTime() < now)
      .map((c) => predictReorder(c, db.orders, db.products))
      .filter((p): p is ReorderPrediction => Boolean(p) && p!.likelihood !== "low")
      .sort(
        (a, b) =>
          LIKELIHOOD_RANK[a.likelihood] - LIKELIHOOD_RANK[b.likelihood] ||
          Math.abs(a.daysUntilExpected) - Math.abs(b.daysUntilExpected),
      );
    return limit ? list.slice(0, limit) : list;
  });
}

export function snoozeReorder(customerId: string, days = 7) {
  return mutate((db) => {
    const customer = must(db.customers.find((c) => c.id === customerId), "Customer", customerId);
    customer.reorderSnoozedUntil = new Date(Date.now() + days * 86_400_000).toISOString();
    return customer;
  });
}

export function addCustomerNote(customerId: string, note: string) {
  return mutate((db) => {
    const customer = must(db.customers.find((c) => c.id === customerId), "Customer", customerId);
    customer.notes.unshift(note);
    return customer;
  });
}

export function findCustomerByMobile(mobile: string) {
  return query((db) => findCustomerByMobileSync(db, mobile) ?? null, 0);
}
