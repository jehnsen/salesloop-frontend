import { dayOffset } from "@/lib/utils";
import { query } from "./_mock";

export interface NavCounts {
  conversationsNeedingSeller: number;
  unreadMessages: number;
  followUpsDue: number;
  newOrderInquiries: number;
  newLeads: number;
}

export function getNavCounts() {
  return query<NavCounts>(
    (db) => ({
      conversationsNeedingSeller: db.conversations.filter((c) => c.status === "needs_seller").length,
      unreadMessages: db.conversations.reduce((sum, c) => sum + c.unread, 0),
      followUpsDue: db.followUps.filter((f) => f.status === "scheduled" && dayOffset(f.scheduledAt) <= 0).length,
      newOrderInquiries: db.orders.filter((o) => o.status === "inquiry").length,
      newLeads: db.leads.filter((l) => l.stage === "new").length,
    }),
    0,
  );
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  timestamp: string;
  tone: "urgent" | "info" | "success";
}

/** Notification bell: escalations, approvals, and new inquiries, newest first. */
export function getNotifications(limit = 8) {
  return query<AppNotification[]>((db) => {
    const fromActivity = db.aiActivity
      .filter((a) => a.status === "escalated" || a.status === "pending_approval" || a.type === "captured_lead")
      .map<AppNotification>((a) => ({
        id: a.id,
        title: a.action,
        description: `${a.customerName} · ${a.result}`,
        href: a.leadId ? `/admin/leads/${a.leadId}` : a.customerId ? `/admin/customers/${a.customerId}` : "/admin/ai-agent",
        timestamp: a.timestamp,
        tone: a.status === "escalated" ? "urgent" : a.type === "captured_lead" ? "success" : "info",
      }));
    const inquiries = db.orders
      .filter((o) => o.status === "inquiry")
      .map<AppNotification>((o) => ({
        id: `n_${o.id}`,
        title: "New order inquiry",
        description: `${o.customerName} · ${o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}`,
        href: `/admin/orders?focus=${o.id}`,
        timestamp: o.createdAt,
        tone: "info",
      }));
    return [...fromActivity, ...inquiries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  }, 100);
}

export interface SearchResult {
  id: string;
  type: "Lead" | "Customer" | "Order" | "Product";
  title: string;
  subtitle: string;
  href: string;
}

/** Global admin search across leads, customers, orders, and products. */
export function globalSearch(term: string) {
  return query<SearchResult[]>((db) => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return [];
    const match = (...fields: (string | undefined)[]) => fields.some((f) => f?.toLowerCase().includes(q));
    return [
      ...db.leads
        .filter((l) => match(l.name, l.mobile, l.location))
        .map((l) => ({ id: l.id, type: "Lead" as const, title: l.name, subtitle: `${l.location ?? "No location"} · score ${l.leadScore}`, href: `/admin/leads/${l.id}` })),
      ...db.customers
        .filter((c) => match(c.name, c.mobile, c.location))
        .map((c) => ({ id: c.id, type: "Customer" as const, title: c.name, subtitle: c.location, href: `/admin/customers/${c.id}` })),
      ...db.orders
        .filter((o) => match(o.reference, o.customerName))
        .map((o) => ({ id: o.id, type: "Order" as const, title: o.reference, subtitle: o.customerName, href: `/admin/orders?focus=${o.id}` })),
      ...db.products
        .filter((p) => match(p.name, ...p.aliases))
        .map((p) => ({ id: p.id, type: "Product" as const, title: p.name, subtitle: p.unit, href: `/admin/products?focus=${p.id}` })),
    ].slice(0, 12);
  }, 120);
}
