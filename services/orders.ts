import type { Order, OrderInquiryInput, OrderStatus } from "@/types";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { createId, isValidPHMobile } from "@/lib/utils";
import { must, mutate, nowIso, query } from "./_mock";
import { addTimeline, createLeadRecord, findCustomerByMobileSync, findLeadByMobile, logActivity } from "./_records";

export function getOrders() {
  return query((db) => [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function getOrderById(id: string) {
  return query((db) => db.orders.find((o) => o.id === id) ?? null);
}

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super("Please check the highlighted fields.");
    this.name = "ValidationError";
  }
}

/**
 * Customer-facing order inquiry. Not a checkout: the seller confirms stock,
 * total, payment, and delivery afterwards.
 */
export function createOrderInquiry(input: OrderInquiryInput & { aiAssisted?: boolean }) {
  return mutate((db) => {
    const errors: Record<string, string> = {};
    if (!input.fullName.trim()) errors.fullName = "Please enter your full name.";
    if (!isValidPHMobile(input.mobile)) errors.mobile = "Please enter a valid PH mobile number.";
    if (!input.location.trim()) errors.location = "Please enter your city or municipality.";
    const product = db.products.find((p) => p.slug === input.productSlug && !p.archived);
    if (!product) errors.productSlug = "Please choose a product.";
    if (!(input.quantity > 0)) errors.quantity = "Quantity must be at least 1.";
    if (Object.keys(errors).length || !product) throw new ValidationError(errors);

    const customer = findCustomerByMobileSync(db, input.mobile);
    let lead = findLeadByMobile(db, input.mobile);
    const source = input.aiAssisted ? "website_chat" : "order_form";

    if (!lead && !customer) {
      lead = createLeadRecord(db, {
        name: input.fullName,
        mobile: input.mobile,
        email: input.email,
        messengerName: input.messengerName,
        location: input.location,
        source,
        interests: [{ productSlug: product.slug, quantity: input.quantity }],
        leadScore: 85,
        purchaseIntent: "high",
        lastIntent: "buy_product",
        stage: "order_inquiry",
        preferredChannel: input.preferredContact,
        aiSummary: `Sent an order inquiry for ${input.quantity} × ${product.name} (${input.location}).`,
        recommendedAction: "Confirm availability, total amount, payment, and delivery schedule.",
      });
    } else if (lead && !["converted", "lost"].includes(lead.stage)) {
      lead.stage = "order_inquiry";
      lead.leadScore = Math.max(lead.leadScore, 85);
      lead.purchaseIntent = "high";
    }

    const created = nowIso();
    const order: Order = {
      id: createId("ord"),
      reference: `LW-${10240 + db.orders.length + 1}`,
      customerName: input.fullName,
      customerId: customer?.id,
      leadId: lead?.id,
      mobile: input.mobile,
      messengerName: input.messengerName,
      email: input.email,
      items: [{ productSlug: product.slug, productName: product.name, quantity: input.quantity, unitPrice: product.price }],
      total: product.price * input.quantity,
      deliveryLocation: input.location,
      paymentMethod: "To be confirmed",
      preferredContact: input.preferredContact,
      notes: input.notes,
      status: "inquiry",
      aiAssisted: Boolean(input.aiAssisted),
      source,
      createdAt: created,
      updatedAt: created,
      statusHistory: [{ status: "inquiry", at: created }],
    };
    db.orders.unshift(order);

    if (lead) {
      addTimeline(lead, {
        type: "inquiry",
        title: `Sent an order inquiry: ${product.name} × ${input.quantity}`,
        description: `Order ${order.reference}`,
      });
    }
    logActivity(db, {
      type: "detected_high_intent",
      customerName: input.fullName,
      leadId: lead?.id,
      customerId: customer?.id,
      action: customer ? "Repeat customer sent an order inquiry" : "New order inquiry received",
      reasoning: `${input.quantity} × ${product.name} to ${input.location}.`,
      result: `Order ${order.reference} awaiting seller confirmation`,
      status: "pending_approval",
    });
    return order;
  });
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return mutate((db) => {
    const order = must(db.orders.find((o) => o.id === id), "Order", id);
    order.status = status;
    order.updatedAt = nowIso();
    order.statusHistory.push({ status, at: order.updatedAt });
    const lead = order.leadId ? db.leads.find((l) => l.id === order.leadId) : undefined;
    if (lead) {
      addTimeline(lead, { type: "order", title: `Order ${order.reference}: ${ORDER_STATUS_LABEL[status]}` });
    }
    return order;
  });
}

export function updateOrderDetails(id: string, patch: Partial<Pick<Order, "notes" | "paymentMethod" | "deliveryLocation">>) {
  return mutate((db) => {
    const order = must(db.orders.find((o) => o.id === id), "Order", id);
    Object.assign(order, patch, { updatedAt: nowIso() });
    return order;
  });
}
