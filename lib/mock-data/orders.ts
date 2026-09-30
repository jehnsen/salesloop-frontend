import type { ContactChannel, LeadSource, Order, OrderStatus } from "@/types";
import { ORDER_STATUSES } from "@/lib/constants";
import { products } from "./products";
import { hoursAgo } from "./time";

interface OrderSeed {
  customerId?: string;
  leadId?: string;
  name: string;
  mobile: string;
  items: [slug: string, quantity: number][];
  /** When the inquiry was created, in hours ago. */
  createdHoursAgo: number;
  status: OrderStatus;
  location: string;
  payment: string;
  contact: ContactChannel;
  source: LeadSource;
  aiAssisted: boolean;
  notes?: string;
}

const FLOW: OrderStatus[] = ORDER_STATUSES.map((s) => s.id).filter((s) => s !== "cancelled");

function buildHistory(status: OrderStatus, createdHoursAgo: number) {
  if (status === "cancelled") {
    return [
      { status: "inquiry" as const, at: hoursAgo(createdHoursAgo) },
      { status: "cancelled" as const, at: hoursAgo(Math.max(createdHoursAgo - 20, 1)) },
    ];
  }
  const steps = FLOW.slice(0, FLOW.indexOf(status) + 1);
  // Spread status changes evenly between creation and "a little while ago".
  const span = Math.max(createdHoursAgo - 1, steps.length);
  return steps.map((s, i) => ({
    status: s,
    at: hoursAgo(createdHoursAgo - (span / Math.max(steps.length - 1, 1)) * i),
  }));
}

function buildOrder(seed: OrderSeed, index: number): Order {
  const items = seed.items.map(([slug, quantity]) => {
    const product = products.find((p) => p.slug === slug);
    if (!product) throw new Error(`Unknown product in mock order: ${slug}`);
    return { productSlug: slug, productName: product.name, quantity, unitPrice: product.price };
  });
  const history = buildHistory(seed.status, seed.createdHoursAgo);
  return {
    id: `ord_${String(index + 1).padStart(3, "0")}`,
    reference: `LW-${String(10240 + index)}`,
    customerName: seed.name,
    customerId: seed.customerId,
    leadId: seed.leadId,
    mobile: seed.mobile,
    items,
    total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    deliveryLocation: seed.location,
    paymentMethod: seed.payment,
    preferredContact: seed.contact,
    notes: seed.notes,
    status: seed.status,
    aiAssisted: seed.aiAssisted,
    source: seed.source,
    createdAt: hoursAgo(seed.createdHoursAgo),
    updatedAt: history[history.length - 1].at,
    statusHistory: history,
  };
}

const d = (days: number) => days * 24;

const seeds: OrderSeed[] = [
  // Maria Santos: Lingzhi 3-in-1 every ~40 days
  { customerId: "cus_001", name: "Maria Santos", mobile: "0917 555 0101", items: [["lingzhi-coffee-3-in-1", 3]], createdHoursAgo: d(115), status: "delivered", location: "Quezon City", payment: "GCash", contact: "messenger", source: "messenger", aiAssisted: false },
  { customerId: "cus_001", name: "Maria Santos", mobile: "0917 555 0101", items: [["lingzhi-coffee-3-in-1", 3], ["ganozhi-soap", 2]], createdHoursAgo: d(75), status: "delivered", location: "Quezon City", payment: "GCash", contact: "messenger", source: "messenger", aiAssisted: true },
  { customerId: "cus_001", name: "Maria Santos", mobile: "0917 555 0101", items: [["lingzhi-coffee-3-in-1", 3]], createdHoursAgo: d(35), status: "delivered", location: "Quezon City", payment: "Cash on delivery", contact: "messenger", source: "website_chat", aiAssisted: true, notes: "Deliver Saturday morning." },
  // Ana Cruz: Cocozhi every ~33 days
  { customerId: "cus_002", name: "Ana Cruz", mobile: "0918 555 0102", items: [["cocozhi-cocoa-drink", 2]], createdHoursAgo: d(66), status: "delivered", location: "Pasig", payment: "Cash on delivery", contact: "sms", source: "facebook", aiAssisted: false },
  { customerId: "cus_002", name: "Ana Cruz", mobile: "0918 555 0102", items: [["cocozhi-cocoa-drink", 2]], createdHoursAgo: d(33), status: "delivered", location: "Pasig", payment: "GCash", contact: "sms", source: "website_chat", aiAssisted: true },
  // Jenny Mendoza: overdue
  { customerId: "cus_003", name: "Jenny Mendoza", mobile: "0927 555 0103", items: [["white-coffee-zhino", 2]], createdHoursAgo: d(85), status: "delivered", location: "Antipolo", payment: "Maya", contact: "sms", source: "instagram", aiAssisted: false },
  { customerId: "cus_003", name: "Jenny Mendoza", mobile: "0927 555 0103", items: [["white-coffee-zhino", 4]], createdHoursAgo: d(50), status: "delivered", location: "Antipolo", payment: "Maya", contact: "sms", source: "instagram", aiAssisted: false },
  // Mark Villanueva: black coffee every ~30 days
  { customerId: "cus_004", name: "Mark Villanueva", mobile: "0919 555 0104", items: [["lingzhi-black-coffee", 4]], createdHoursAgo: d(88), status: "delivered", location: "Cainta", payment: "Bank transfer", contact: "messenger", source: "referral", aiAssisted: false },
  { customerId: "cus_004", name: "Mark Villanueva", mobile: "0919 555 0104", items: [["lingzhi-black-coffee", 5]], createdHoursAgo: d(58), status: "delivered", location: "Cainta", payment: "Bank transfer", contact: "messenger", source: "messenger", aiAssisted: true },
  { customerId: "cus_004", name: "Mark Villanueva", mobile: "0919 555 0104", items: [["lingzhi-black-coffee", 4], ["ganozhi-toothpaste", 1]], createdHoursAgo: d(27), status: "delivered", location: "Cainta", payment: "Bank transfer", contact: "messenger", source: "messenger", aiAssisted: true },
  // Paolo Garcia
  { customerId: "cus_005", name: "Paolo Garcia", mobile: "0906 555 0105", items: [["spirulina-tablets", 1]], createdHoursAgo: d(20), status: "delivered", location: "Manila", payment: "GCash", contact: "viber", source: "website_chat", aiAssisted: true },
  // Grace Lim
  { customerId: "cus_006", name: "Grace Lim", mobile: "0917 555 0106", items: [["rg-reishi-gano", 1], ["gl-ganocelium", 1]], createdHoursAgo: d(40), status: "delivered", location: "Caloocan", payment: "Bank transfer", contact: "email", source: "facebook", aiAssisted: false },
  { customerId: "cus_006", name: "Grace Lim", mobile: "0917 555 0106", items: [["rg-reishi-gano", 1]], createdHoursAgo: d(10), status: "delivered", location: "Caloocan", payment: "Bank transfer", contact: "email", source: "website_chat", aiAssisted: true },
  // Joy Navarro: inactive
  { customerId: "cus_007", name: "Joy Navarro", mobile: "0928 555 0107", items: [["lingzhi-coffee-3-in-1", 5]], createdHoursAgo: d(140), status: "delivered", location: "Bulacan", payment: "Cash on delivery", contact: "sms", source: "facebook", aiAssisted: false },
  { customerId: "cus_007", name: "Joy Navarro", mobile: "0928 555 0107", items: [["lingzhi-coffee-3-in-1", 5]], createdHoursAgo: d(100), status: "delivered", location: "Bulacan", payment: "Cash on delivery", contact: "sms", source: "facebook", aiAssisted: false },
  // Ramon Aquino
  { customerId: "cus_008", name: "Ramon Aquino", mobile: "0916 555 0108", items: [["ganozhi-soap", 6], ["ganozhi-toothpaste", 2]], createdHoursAgo: d(25), status: "delivered", location: "Quezon City", payment: "Cash on delivery", contact: "mobile", source: "referral", aiAssisted: false },
  // Teresa Flores (converted from website chat)
  { customerId: "cus_009", leadId: "led_015", name: "Teresa Flores", mobile: "0917 555 0109", items: [["cocozhi-cocoa-drink", 1], ["lingzhi-coffee-3-in-1", 1]], createdHoursAgo: d(8), status: "delivered", location: "Pasig", payment: "GCash", contact: "messenger", source: "website_chat", aiAssisted: true },
  // Liza Tan
  { customerId: "cus_010", name: "Liza Tan", mobile: "0918 555 0110", items: [["cordyceps-coffee-3-in-1", 2]], createdHoursAgo: d(70), status: "delivered", location: "Makati", payment: "Maya", contact: "email", source: "instagram", aiAssisted: false },
  { customerId: "cus_010", name: "Liza Tan", mobile: "0918 555 0110", items: [["cordyceps-coffee-3-in-1", 2]], createdHoursAgo: d(38), status: "delivered", location: "Makati", payment: "Maya", contact: "email", source: "website_chat", aiAssisted: true },
  // Open orders in the pipeline
  { customerId: "cus_011", leadId: "led_010", name: "Camille Sy", mobile: "0917 555 0111", items: [["lingzhi-black-coffee", 2]], createdHoursAgo: 46, status: "confirmed", location: "Taguig", payment: "GCash", contact: "viber", source: "referral", aiAssisted: false },
  { customerId: "cus_012", leadId: "led_011", name: "Arnel Mercado", mobile: "0999 555 0112", items: [["rg-reishi-gano", 1], ["gl-ganocelium", 1]], createdHoursAgo: 30, status: "preparing", location: "Pasay", payment: "Cash on delivery", contact: "mobile", source: "website_chat", aiAssisted: true },
  { customerId: "cus_013", leadId: "led_012", name: "Lovely Manalo", mobile: "0935 555 0113", items: [["spirulina-cereal", 4]], createdHoursAgo: d(4), status: "shipped", location: "Bulacan", payment: "GCash", contact: "messenger", source: "facebook", aiAssisted: true, notes: "Courier: J&T placeholder. Meycauayan address." },
  { leadId: "led_004", name: "Bea Santiago", mobile: "0921 555 0204", items: [["white-coffee-zhino", 3], ["ganozhi-soap", 2]], createdHoursAgo: 22, status: "pending_confirmation", location: "Marikina", payment: "GCash", contact: "messenger", source: "messenger", aiAssisted: true, notes: "Waiting for GCash payment screenshot." },
  { leadId: "led_003", name: "Enzo Castillo", mobile: "0917 555 0203", items: [["spirulina-tablets", 2]], createdHoursAgo: 5, status: "inquiry", location: "Taguig", payment: "To be confirmed", contact: "sms", source: "order_form", aiAssisted: false, notes: "Can I pick up on Saturday?" },
  { leadId: "led_009", name: "Dennis Ocampo", mobile: "0998 555 0209", items: [["lingzhi-coffee-3-in-1", 10]], createdHoursAgo: d(6), status: "cancelled", location: "Valenzuela", payment: "To be confirmed", contact: "messenger", source: "facebook", aiAssisted: true, notes: "Customer cancelled: found another supplier." },
  { customerId: "cus_004", name: "Mark Villanueva", mobile: "0919 555 0104", items: [["cocozhi-cocoa-drink", 2]], createdHoursAgo: 3, status: "ready_for_delivery", location: "Cainta", payment: "Bank transfer", contact: "messenger", source: "messenger", aiAssisted: false, notes: "Add-on order for officemates." },
];

export const orders: Order[] = seeds.map(buildOrder);
