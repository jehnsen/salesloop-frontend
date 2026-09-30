import type {
  AIAgentConfig,
  AIAnalysis,
  AIIntent,
  AINextAction,
  ChatAttachment,
  Customer,
  Product,
  PurchaseIntent,
  SiteConfig,
} from "@/types";
import { PH_LOCATIONS } from "@/lib/constants";
import { formatPeso } from "@/lib/utils";

/**
 * Rule-based stand-in for the future LLM + RAG pipeline.
 *
 * `analyzeMessage` produces the same structured `AIAnalysis` a real model would
 * return through tool calling; `composeReply` turns it into a customer-safe reply
 * using only catalog data. Swap both for API calls when the backend exists.
 */

export interface ChatSessionState {
  productSlug?: string;
  quantity?: number;
  location?: string;
  name?: string;
  mobile?: string;
  leadCaptured: boolean;
  leadId?: string;
  leadScore: number;
  handedOff: boolean;
  returningCustomerId?: string;
}

export const initialSessionState: ChatSessionState = {
  leadCaptured: false,
  leadScore: 10,
  handedOff: false,
};

export interface EngineContext {
  products: Product[];
  config: AIAgentConfig;
  site: SiteConfig;
  /** Customer matched by mobile number, if any (repeat customer detection). */
  knownCustomer?: Customer & { lastOrder?: { productSlug: string; quantity: number } };
}

export interface EngineReply {
  message: string;
  attachments: ChatAttachment[];
  suggestions: string[];
  analysis: AIAnalysis;
  state: ChatSessionState;
}

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  isa: 1, isang: 1, one: 1,
  dalawa: 2, dalawang: 2, two: 2,
  tatlo: 3, tatlong: 3, three: 3,
  apat: 4, four: 4,
  lima: 5, limang: 5, five: 5,
  anim: 6, six: 6,
  pito: 7, pitong: 7, seven: 7,
  walo: 8, walong: 8, eight: 8,
  siyam: 9, nine: 9,
  sampu: 10, sampung: 10, ten: 10,
};

const UNIT_WORDS = "(?:box|boxes|kahon|pack|packs|bottle|bottles|bote|pcs|pieces|piraso|bars?|tubes?|sachets?|order)";
const BUY_VERBS = "(?:kukuha|kuha|bibili|bili|order|oorder|mag-?order|buy|get|take|reserve|pa-?order)";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesWord(text: string, phrase: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(phrase)}([^a-z0-9]|$)`, "i").test(text);
}

function hasAny(text: string, words: string[]) {
  return words.some((w) => includesWord(text, w));
}

/** Longest-alias-first matching so "lingzhi black coffee" doesn't also match "lingzhi". */
export function detectProducts(text: string, products: Product[]) {
  const pairs = products
    .filter((p) => !p.archived)
    .flatMap((p) => [p.name.toLowerCase(), p.slug.replace(/-/g, " "), ...p.aliases].map((alias) => ({ alias: alias.toLowerCase(), product: p })))
    .sort((a, b) => b.alias.length - a.alias.length);

  let remaining = ` ${text.toLowerCase()} `;
  const found: Product[] = [];
  for (const { alias, product } of pairs) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(alias)}(?=[^a-z0-9]|$)`, "i");
    if (pattern.test(remaining)) {
      remaining = remaining.replace(pattern, (_m, lead: string) => `${lead}${" ".repeat(alias.length)}`);
      if (!found.includes(product)) found.push(product);
    }
  }
  return { found, remaining };
}

export function detectQuantity(text: string): number | undefined {
  const t = text.toLowerCase().replace(/(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}/g, " ");
  const numberToken = `(\\d{1,3}|${Object.keys(NUMBER_WORDS).join("|")})`;
  const patterns = [
    new RegExp(`${numberToken}\\s*(?:na\\s+)?${UNIT_WORDS}`, "i"),
    new RegExp(`${BUY_VERBS}\\D{0,20}?\\b${numberToken}\\b(?![\\d-])`, "i"),
    new RegExp(`x\\s?(\\d{1,3})\\b`, "i"),
    new RegExp(`\\b(\\d{1,3})\\s?x\\b`, "i"),
    new RegExp(`(?:^|\\s)(isa|isang|dalawa|dalawang|tatlo|tatlong|apat|lima|limang|anim|sampu)(?:\\s|$|[.,!?])`, "i"),
  ];
  for (const pattern of patterns) {
    const match = t.match(pattern);
    const token = match?.[1];
    if (!token) continue;
    const value = /^\d+$/.test(token) ? Number(token) : NUMBER_WORDS[token.toLowerCase()];
    if (value && value > 0 && value <= 200) return value;
  }
  return undefined;
}

export function detectLocation(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/\bqc\b/.test(t)) return "Quezon City";
  const sorted = [...PH_LOCATIONS].sort((a, b) => b.length - a.length);
  const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const normalized = plain(t);
  return sorted.find((loc) => includesWord(normalized, plain(loc)));
}

export function detectMobile(text: string): string | undefined {
  const match = text.match(/(\+639|09)\d{2}[\s-]?\d{3}[\s-]?\d{4}/);
  return match?.[0];
}

export function detectName(text: string): string | undefined {
  const patterns = [
    /(?:[Mm]y name is|[Ii] am|[Ii]'m|[Aa]ko si|[Tt]his is|[Nn]ame:)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/,
    /^([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\s*,\s*(?:\+639|09)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------

const MEDICAL_WORDS = [
  "diabetes", "diabetic", "high blood", "highblood", "hypertension", "cancer", "tumor", "sakit", "may sakit",
  "gamot", "medicine", "medication", "maintenance", "pregnant", "buntis", "breastfeeding", "nagpapasuso",
  "cure", "gamutin", "lunas", "kidney", "liver", "heart", "puso", "cholesterol", "allergy", "allergic",
  "sick", "illness", "disease", "doctor", "treatment", "treat", "arthritis", "asthma", "hika", "uric acid",
  "gout", "stroke", "immune", "immunity", "pampagaling", "pampapayat", "weight loss", "detox",
];
const COMPLAINT_WORDS = [
  "refund", "ibalik", "sira", "damaged", "expired", "complain", "complaint", "reklamo", "wala pa",
  "late", "delayed", "hindi dumating", "di dumating", "wrong item", "mali", "defective", "return",
];
const HANDOFF_WORDS = [
  "talk to seller", "talk to a person", "human", "real person", "agent", "tao", "kausap", "call me",
  "tawagan", "talk to the seller", "contact seller", "message seller", "sa seller", "seller please", "owner",
];
const REORDER_WORDS = ["ulit", "reorder", "re-order", "same order", "same as before", "as before", "same quantity", "order again", "katulad dati", "gaya ng dati", "usual"];
const COMPARE_WORDS = ["difference", "compare", "comparison", "vs", "versus", "pinagkaiba", "pagkakaiba", "alin mas", "which is better", "which one"];
const PRICE_WORDS = ["magkano", "presyo", "price", "prices", "how much", "hm", "cost", "halaga", "hmp"];
const AVAILABILITY_WORDS = ["available", "availability", "stock", "meron", "mayroon", "may stock", "avail", "in stock", "check availability"];
const SHIPPING_WORDS = ["deliver", "delivery", "ship", "shipping", "padala", "sf", "shipping fee", "delivery fee", "cod", "pickup", "pick up", "pick-up", "courier", "lalamove"];
const BUY_WORDS = ["order", "bibili", "kukuha", "bili", "buy", "purchase", "i'll take", "gusto ko", "pa-order", "reserve", "checkout", "yes", "sige", "go"];
const RECOMMEND_WORDS = ["recommend", "suggest", "ano maganda", "best", "para sa akin", "what should", "ano ang", "recommendation"];
const ORDER_HOW_WORDS = ["how do i order", "how to order", "paano mag-order", "paano mag order", "paano umorder", "paano bumili", "how can i order", "ordering"];
const GREETING_WORDS = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "kumusta", "musta"];

interface Signals {
  medical: boolean;
  complaint: boolean;
  refund: boolean;
  handoff: boolean;
  reorder: boolean;
  compare: boolean;
  price: boolean;
  availability: boolean;
  shipping: boolean;
  buy: boolean;
  recommend: boolean;
  howToOrder: boolean;
  greeting: boolean;
  preparation: boolean;
  ingredients: boolean;
}

function readSignals(text: string): Signals {
  const t = text.toLowerCase();
  return {
    medical: hasAny(t, MEDICAL_WORDS) || /pwede\s+ba\s+(?:ito|to|ang\s+\w+)?\s*sa\s+may/.test(t) || /safe\s+(?:for|ba)/.test(t),
    complaint: hasAny(t, COMPLAINT_WORDS),
    refund: hasAny(t, ["refund", "ibalik", "return"]),
    handoff: hasAny(t, HANDOFF_WORDS),
    reorder: hasAny(t, REORDER_WORDS),
    compare: hasAny(t, COMPARE_WORDS),
    price: hasAny(t, PRICE_WORDS),
    availability: hasAny(t, AVAILABILITY_WORDS),
    shipping: hasAny(t, SHIPPING_WORDS),
    buy: hasAny(t, BUY_WORDS) || new RegExp(BUY_VERBS, "i").test(t),
    recommend: hasAny(t, RECOMMEND_WORDS),
    howToOrder: hasAny(t, ORDER_HOW_WORDS),
    greeting: hasAny(t, GREETING_WORDS),
    preparation: hasAny(t, ["prepare", "preparation", "timpla", "paano gamitin", "how to use", "how to drink", "how to make", "paano inumin", "usage"]),
    ingredients: hasAny(t, ["ingredient", "ingredients", "sangkap", "laman", "contains", "what's in"]),
  };
}

function pickIntent(s: Signals, hasProduct: boolean, hasEntities: boolean): AIIntent {
  if (s.medical) return "medical_question";
  if (s.complaint) return "complaint";
  if (s.handoff) return "human_handoff";
  if (s.reorder) return "reorder";
  if (s.compare) return "product_comparison";
  if (s.howToOrder) return "general_question";
  if (s.shipping) return "shipping_inquiry";
  if (s.price) return "price_inquiry";
  if (s.availability) return "availability_inquiry";
  if (s.buy || hasEntities) return "buy_product";
  if (s.recommend) return "product_inquiry";
  if (hasProduct || s.preparation || s.ingredients) return "product_inquiry";
  if (s.greeting) return "general_question";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export function analyzeMessage(text: string, state: ChatSessionState, ctx: EngineContext) {
  const { found, remaining } = detectProducts(text, ctx.products);
  const signals = readSignals(text);
  const quantity = detectQuantity(remaining);
  const location = detectLocation(text);
  const mobile = detectMobile(text);
  const name = detectName(text);

  const preference = detectPreference(text, ctx.products);
  let intent = pickIntent(signals, found.length > 0, Boolean((quantity || location) && (found.length || state.productSlug)));
  if (intent === "unknown" && preference) intent = "product_inquiry";

  const productSlugs = found.length ? found.map((p) => p.slug) : state.productSlug ? [state.productSlug] : [];
  const next: ChatSessionState = {
    ...state,
    productSlug: found[0]?.slug ?? state.productSlug,
    quantity: quantity ?? (found.length && found[0].slug !== state.productSlug ? undefined : state.quantity),
    location: location ?? state.location,
    mobile: mobile ?? state.mobile,
    name: name ?? state.name,
  };

  // Lead score: cumulative, based on how much buying information we have.
  let score = state.leadScore;
  if (found.length) score = Math.max(score, 30);
  if (signals.price || signals.availability) score += 8;
  if (quantity) score += 16;
  if (location) score += 10;
  if (mobile) score += 12;
  if (intent === "buy_product") score += 10;
  if (intent === "reorder") score += 20;
  if (next.productSlug && next.quantity && next.location) score = Math.max(score, 80);
  score = Math.min(99, score);
  next.leadScore = score;

  let purchaseIntent: PurchaseIntent = "low";
  if (["buy_product", "reorder"].includes(intent) || (quantity && next.productSlug)) purchaseIntent = "high";
  else if (["price_inquiry", "availability_inquiry", "shipping_inquiry", "product_comparison", "product_inquiry"].includes(intent)) purchaseIntent = "medium";
  if (score >= 75) purchaseIntent = "high";
  if (intent === "medical_question" && purchaseIntent === "high") purchaseIntent = "medium";

  const objections: string[] = [];
  if (/mahal|expensive|pricey|discount|tawad/i.test(text)) objections.push("Price concern");
  if (/pag-?isipan|think about it|later|mamaya|next time/i.test(text)) objections.push("Undecided");
  if (signals.shipping && /fee|magkano/i.test(text)) objections.push("Asked about the delivery fee");

  const capability = (id: string) => ctx.config.capabilities.find((c) => c.id === id)?.enabled ?? true;
  const guardrail = (id: string) => ctx.config.guardrails.find((g) => g.id === id)?.enabled ?? true;

  const nextAction = decideNextAction(intent, signals, next, {
    capability,
    hasPreference: Boolean(preference) && found.length === 0,
  });
  const escalate =
    (intent === "medical_question" && guardrail("escalate_medical")) ||
    (intent === "complaint" && (guardrail("escalate_complaints") || (signals.refund && guardrail("escalate_refunds")))) ||
    (intent === "human_handoff" && capability("human_handoff"));

  const analysis: AIAnalysis = {
    intent,
    confidence: confidenceFor(intent, signals, found.length),
    purchaseIntent,
    products: productSlugs,
    quantity: next.quantity,
    location: next.location,
    leadScore: score,
    nextAction,
    medicalFlag: intent === "medical_question" || undefined,
    escalate: escalate || undefined,
    objections: objections.length ? objections : undefined,
  };

  return { analysis, state: next, signals, found };
}

function confidenceFor(intent: AIIntent, s: Signals, productCount: number) {
  if (intent === "unknown") return 0.35;
  const strongSignals = Object.values(s).filter(Boolean).length;
  const base = intent === "medical_question" || intent === "reorder" ? 0.9 : 0.72;
  return Math.min(0.98, Number((base + strongSignals * 0.03 + productCount * 0.04).toFixed(2)));
}

function decideNextAction(
  intent: AIIntent,
  s: Signals,
  st: ChatSessionState,
  opts: { capability: (id: string) => boolean; hasPreference: boolean },
): AINextAction {
  if (intent === "medical_question") return "suggest_consulting_professional";
  if (intent === "complaint" || intent === "human_handoff") return "escalate_to_seller";
  if (intent === "reorder") return "offer_reorder";
  if (opts.hasPreference && opts.capability("product_recommendation")) return "recommend_product";
  if (intent === "product_comparison") return opts.capability("product_comparison") ? "compare_products" : "answer_question";
  if (intent === "general_question" || intent === "unknown") return "answer_question";
  if (!st.productSlug) {
    if (intent === "shipping_inquiry") return st.location ? "answer_question" : "ask_location";
    return opts.capability("product_recommendation") || s.price || s.availability ? "recommend_product" : "answer_question";
  }
  const buyingFlow = ["buy_product", "price_inquiry", "availability_inquiry", "shipping_inquiry"].includes(intent);
  if (!buyingFlow || !opts.capability("order_inquiry_assistance")) return "answer_question";
  if (!st.quantity) return intent === "shipping_inquiry" && !st.location ? "ask_location" : "ask_quantity";
  if (!st.location) return "ask_location";
  if (!st.leadCaptured && !st.mobile && opts.capability("lead_capture")) return "capture_contact";
  return "create_order_inquiry";
}

// ---------------------------------------------------------------------------
// Reply composition
// ---------------------------------------------------------------------------

function unitWord(product: Product, qty = 2) {
  const unit = product.unit.toLowerCase();
  const base = unit.startsWith("bottle") ? "bottle" : unit.startsWith("bar") ? "bar" : unit.startsWith("tube") ? "tube" : unit.startsWith("pack") ? "pack" : "box";
  if (qty === 1) return base;
  return base === "box" ? "boxes" : `${base}s`;
}

function stockPhrase(product: Product) {
  switch (product.stockStatus) {
    case "in_stock":
      return `${product.name} is available`;
    case "low_stock":
      return `${product.name} is available, but stock is limited right now`;
    case "out_of_stock":
      return `${product.name} is currently out of stock and being restocked`;
    case "pre_order":
      return `${product.name} is available for pre-order (the seller will confirm the arrival date)`;
  }
}

function stockShort(product: Product) {
  switch (product.stockStatus) {
    case "in_stock":
      return "It's currently available.";
    case "low_stock":
      return "Stock is limited right now.";
    case "out_of_stock":
      return "It's currently out of stock and being restocked.";
    case "pre_order":
      return "It's available for pre-order.";
  }
}

function priceLine(product: Product) {
  return `${formatPeso(product.price)} per ${unitWord(product, 1)} (reference price)`;
}

function productCardsFor(products: Product[], slugs?: string[]) {
  const pool = slugs ? products.filter((p) => slugs.includes(p.slug)) : products.filter((p) => p.isBestSeller);
  return { type: "product_cards" as const, productSlugs: pool.filter((p) => p.approvedForAI && !p.archived).slice(0, 4).map((p) => p.slug) };
}

const DEFAULT_SUGGESTIONS = ["Recommend a coffee", "Compare products", "Check availability", "How do I order?", "Talk to seller"];

/** Maps taste/routine preferences ("not too sweet", "for kids") to a product. */
function detectPreference(text: string, products: Product[]) {
  const t = text.toLowerCase();
  const pick = (slug: string) => products.find((p) => p.slug === slug && p.approvedForAI && !p.archived);
  if (/(not|hindi|di)\s*(too\s*)?(sweet|matamis)|(ayaw|hindi|di)\b.*\b(matamis|sweet)|less sweet|no sugar|walang asukal|plain|bold|black/.test(t)) {
    return pick("lingzhi-black-coffee");
  }
  if (/milky|latte|mild|light coffee|gatas/.test(t)) return pick("white-coffee-zhino");
  if (/kids|bata|chocolate|choco|no coffee|walang kape|cocoa/.test(t)) return pick("cocozhi-cocoa-drink");
  if (/tea|evening|gabi|relax|tsaa/.test(t)) return pick("spica-tea");
  if (/breakfast|almusal|cereal/.test(t)) return pick("spirulina-cereal");
  if (/creamy|sweet|matamis|3.?in.?1/.test(t)) return pick("lingzhi-coffee-3-in-1");
  return undefined;
}

function comparisonText(a: Product, b: Product) {
  const slugs = [a.slug, b.slug].sort().join("|");
  if (slugs === ["lingzhi-black-coffee", "lingzhi-coffee-3-in-1"].sort().join("|")) {
    return "Black coffee has a simpler coffee profile, while 3-in-1 includes additional ingredients (creamer and sugar) for a creamier and sweeter taste. Would you like me to compare the available options side by side?";
  }
  return `${a.name}: ${a.summary}\n\n${b.name}: ${b.summary}\n\nWould you like the prices or preparation details for either one?`;
}

export function composeReply(text: string, state: ChatSessionState, ctx: EngineContext): EngineReply {
  const { analysis, state: next, signals, found } = analyzeMessage(text, state, ctx);
  const approved = ctx.products.filter((p) => p.approvedForAI && !p.archived);
  const product = next.productSlug ? ctx.products.find((p) => p.slug === next.productSlug) : undefined;
  const attachments: ChatAttachment[] = [];
  let suggestions: string[] = [];
  let message = "";

  const contactLine = `You can also reach ${ctx.site.seller.name} on Messenger (${ctx.site.contact.messenger}) or at ${ctx.site.contact.mobile}, ${ctx.site.contact.hours}.`;

  // Guardrail: product exists but the seller hasn't approved it for AI answers.
  const unapproved = found.find((p) => !p.approvedForAI);
  if (unapproved && ctx.config.guardrails.find((g) => g.id === "approved_knowledge_only")?.enabled !== false) {
    message = `I don't have seller-approved information about ${unapproved.name} yet, so I'd rather not guess. I've noted your question so the seller can answer it personally.`;
    attachments.push({ type: "handoff" });
    return finish({ ...analysis, escalate: true, nextAction: "escalate_to_seller" });
  }

  switch (analysis.nextAction) {
    case "suggest_consulting_professional": {
      const isSupplement = product?.category === "supplements";
      const productLine = product
        ? ` ${product.name} is ${isSupplement ? "a food supplement" : "a food/consumer product"}, not a medicine, and it should not replace any treatment or medication.`
        : "";
      message = `Thanks for asking. I'm not able to give medical advice.${productLine} Please consult a qualified healthcare professional, especially if you have a condition or take maintenance medicine. I can share the approved label information${analysis.escalate ? ", and I've let the seller know you have a question" : ""}.`;
      attachments.push({ type: "medical_notice" });
      if (analysis.escalate) attachments.push({ type: "handoff" });
      suggestions = product ? ["Show ingredients", "How do I prepare it?", "Talk to seller"] : ["Recommend a coffee", "Talk to seller"];
      next.handedOff = next.handedOff || Boolean(analysis.escalate);
      break;
    }
    case "escalate_to_seller": {
      if (analysis.intent === "complaint") {
        message = signals.refund
          ? "I'm sorry to hear that. I can't process refunds or returns myself, but I've passed this to the seller so they can personally review it and get back to you."
          : "I'm sorry for the trouble. I've flagged this to the seller so they can check personally and update you as soon as possible.";
      } else {
        message = "Sure! I've let the seller know you'd like to talk.";
      }
      message += ` ${contactLine}`;
      attachments.push({ type: "handoff" });
      if (!next.leadCaptured && ctx.config.capabilities.find((c) => c.id === "lead_capture")?.enabled) {
        message += " If you share your name and mobile number, the seller can reach you directly.";
        attachments.push({ type: "lead_form", productSlug: next.productSlug, quantity: next.quantity, location: next.location });
      }
      next.handedOff = true;
      break;
    }
    case "offer_reorder": {
      const known = ctx.knownCustomer;
      if (known?.lastOrder) {
        const p = ctx.products.find((x) => x.slug === known.lastOrder?.productSlug);
        message = `Welcome back, ${known.name.split(" ")[0]}! Same as last time: ${known.lastOrder.quantity} ${p ? unitWord(p, known.lastOrder.quantity) : "boxes"} of ${p?.name ?? "your usual"} delivered to ${known.location}? I'll send a reorder request to the seller to confirm the total and schedule.`;
        attachments.push({ type: "order_link", productSlug: known.lastOrder.productSlug, quantity: known.lastOrder.quantity });
        next.productSlug = known.lastOrder.productSlug;
        next.quantity = known.lastOrder.quantity;
        next.location = known.location;
      } else {
        message = `Welcome back! Happy to help you reorder${product ? ` ${product.name}` : ""}. Share the name and mobile number you used on your last order, and I'll prepare a reorder request for the seller.`;
        attachments.push({ type: "lead_form", productSlug: next.productSlug, quantity: next.quantity, location: next.location });
      }
      suggestions = ["Same quantity as before", "Add another product", "Talk to seller"];
      break;
    }
    case "compare_products": {
      let pair = (found.length ? found : product ? [product] : []).filter((p) => p.approvedForAI).slice(0, 2);
      if (pair.length < 2 && pair[0]) {
        const sibling = approved.find((p) => p.category === pair[0].category && p.slug !== pair[0].slug);
        if (sibling) pair = [pair[0], sibling];
      }
      if (pair.length < 2) {
        pair = approved.filter((p) => ["lingzhi-black-coffee", "lingzhi-coffee-3-in-1"].includes(p.slug));
      }
      if (pair.length === 2) {
        message = comparisonText(pair[0], pair[1]);
        attachments.push({ type: "comparison", productSlugs: pair.map((p) => p.slug) });
        next.productSlug = pair[0].slug;
        suggestions = ["Which is less sweet?", `How much is ${pair[1].name}?`, "Send an order inquiry"];
      } else {
        message = "Which products would you like to compare? Our most-compared pair is Lingzhi Black Coffee vs Lingzhi Coffee 3-in-1.";
        attachments.push(productCardsFor(ctx.products));
      }
      break;
    }
    case "recommend_product": {
      const pick = detectPreference(text, ctx.products);
      if (pick) {
        message = `Based on what you shared, I'd suggest ${pick.name}. ${pick.summary} It's ${priceLine(pick)}. Would you like to know how to prepare it or how many cups a ${unitWord(pick, 1)} makes?`;
        attachments.push({ type: "product_cards", productSlugs: [pick.slug] });
        next.productSlug = pick.slug;
        suggestions = ["How do I prepare it?", "Is it available?", "I'd like to order"];
      } else if (/best ?seller|popular|patok|mabenta|favorite/i.test(text)) {
        message = "Our customer favorites are Lingzhi Coffee 3-in-1, Lingzhi Black Coffee, White Coffee Zhino, and Cocozhi. Would you like me to help you pick one based on your taste?";
        attachments.push(productCardsFor(ctx.products));
        suggestions = ["Not too sweet", "Creamy", "Milky", "No coffee please"];
      } else if (analysis.intent === "price_inquiry") {
        message = "Here are reference prices for our customer favorites. Final prices are confirmed by the seller. Which one are you interested in?";
        attachments.push(productCardsFor(ctx.products));
      } else if (analysis.intent === "availability_inquiry") {
        message = "Which product would you like me to check? Here are some popular ones:";
        attachments.push(productCardsFor(ctx.products));
      } else {
        message = "Happy to help you choose! Do you prefer your coffee plain and bold, creamy and a bit sweet, or milky and mild? If you'd rather skip coffee, we also have cocoa and tea.";
        attachments.push(productCardsFor(ctx.products, ["lingzhi-black-coffee", "lingzhi-coffee-3-in-1", "white-coffee-zhino", "cocozhi-cocoa-drink"]));
        suggestions = ["Not too sweet", "Creamy", "Milky", "No coffee please"];
      }
      break;
    }
    case "ask_quantity": {
      if (!product) break;
      message =
        analysis.intent === "availability_inquiry"
          ? `${stockPhrase(product)}. It's ${priceLine(product)}.`
          : analysis.intent === "price_inquiry"
            ? `${product.name} is ${priceLine(product)}. ${stockShort(product)}`
            : `Great choice! ${stockPhrase(product)}.`;
      message += product.stockStatus === "out_of_stock"
        ? " Would you like the seller to notify you when it's back? If so, how many would you want?"
        : ` How many ${unitWord(product)} would you like?`;
      suggestions = [`1 ${unitWord(product, 1)}`, `3 ${unitWord(product)}`, `5 ${unitWord(product)}`];
      break;
    }
    case "ask_location": {
      if (!product) {
        message = `We deliver within ${ctx.site.deliveryAreas.slice(0, 6).join(", ")}, and nearby areas, and ship provincial orders by courier. What city or municipality are you located in?`;
        suggestions = ["Quezon City", "Pasig", "Antipolo", "Makati"];
        break;
      }
      const q = next.quantity;
      const lead =
        analysis.intent === "price_inquiry" || (q && state.quantity !== q)
          ? `We currently have ${product.name} ${product.stockStatus === "out_of_stock" ? "on restock" : "available"} at ${priceLine(product)}.${q ? ` You're considering ${q} ${unitWord(product, q)}—is that correct?` : ""}`
          : analysis.intent === "shipping_inquiry"
            ? "We deliver within Metro Manila, Rizal, and Bulacan, and ship provincial orders by courier."
            : `${stockPhrase(product)}.`;
      message = `${lead} I can also help check delivery availability. What city or municipality are you located in?`;
      suggestions = ["Quezon City", "Pasig", "Antipolo", "Makati"];
      break;
    }
    case "capture_contact": {
      if (!product || !next.quantity) break;
      const inArea = next.location && ctx.site.deliveryAreas.includes(next.location);
      const total = product.price * next.quantity;
      message = `${inArea ? `Great, we deliver to ${next.location}.` : `We can ship to ${next.location} by courier.`} For ${next.quantity} ${unitWord(product, next.quantity)} of ${product.name}, the reference total is ${formatPeso(total)} before delivery. The seller will confirm the final amount and schedule. May I have your name and mobile number so the seller can reach you?`;
      attachments.push({ type: "lead_form", productSlug: product.slug, quantity: next.quantity, location: next.location });
      break;
    }
    case "create_order_inquiry": {
      if (!product || !next.quantity) break;
      if (analysis.intent === "shipping_inquiry") {
        message = `Delivery fees depend on your exact area in ${next.location}, so the seller will confirm it with you. Would you like me to send an order inquiry for ${next.quantity} ${unitWord(product, next.quantity)} now?`;
      } else {
        message = `${next.name ? `Thanks, ${next.name}! ` : ""}Your order details: ${next.quantity} × ${product.name} for delivery to ${next.location}. Reference total ${formatPeso(product.price * next.quantity)} before delivery. Ready to send the order inquiry?`;
      }
      attachments.push({ type: "order_link", productSlug: product.slug, quantity: next.quantity });
      break;
    }
    case "answer_question":
    default: {
      if (analysis.intent === "shipping_inquiry" && next.location) {
        const inArea = ctx.site.deliveryAreas.includes(next.location);
        message = inArea
          ? `Yes, we deliver to ${next.location}! The seller confirms the delivery fee based on your exact address. Which product are you interested in?`
          : `We can ship to ${next.location} by courier. The seller will confirm the fee and schedule. Which product are you interested in?`;
        attachments.push(productCardsFor(ctx.products));
      } else if (signals.howToOrder) {
        message = `Ordering is simple: 1) choose your products, 2) send an order inquiry (I can prepare it for you), 3) ${ctx.site.seller.name} confirms availability, total amount, payment, and delivery, 4) you pay and receive your order. There's no instant checkout, so every order is personally confirmed.`;
        attachments.push({ type: "order_link", productSlug: next.productSlug, quantity: next.quantity });
        suggestions = ["Recommend a coffee", "What payment methods?", "Where do you deliver?"];
      } else if (product && signals.preparation) {
        message = `How to prepare ${product.name}: ${product.preparation}`;
        suggestions = ["How much is it?", "Show ingredients", "I'd like to order"];
      } else if (product && signals.ingredients) {
        message = `${product.name} ingredients (from the approved product label): ${product.ingredients.join(", ")}.`;
        suggestions = ["How do I prepare it?", "How much is it?", "I'd like to order"];
      } else if (product && found.length) {
        message = `${product.name}: ${product.summary} It's ${priceLine(product)}. ${stockShort(product)}`;
        attachments.push({ type: "product_cards", productSlugs: [product.slug] });
        suggestions = ["How do I prepare it?", "Compare with similar", "I'd like to order"];
      } else if (/payment|bayad|gcash|maya|bank/i.test(text)) {
        const methods = ctx.site.paymentMethods.filter((m) => m.enabled).map((m) => m.label);
        message = `We accept ${methods.join(", ")}. The seller shares payment details after confirming your order.`;
      } else if (/where.*deliver|saan.*deliver|delivery area|areas/i.test(text)) {
        message = `We deliver to ${ctx.site.deliveryAreas.slice(0, 8).join(", ")}, and more. Provincial orders can be shipped by courier.`;
      } else if (signals.greeting) {
        message = ctx.config.greeting + " What can I help you with today?";
        suggestions = DEFAULT_SUGGESTIONS;
      } else if (/salamat|thank/i.test(text)) {
        message = "You're welcome! Let me know if there's anything else I can help with.";
        suggestions = ["Recommend a coffee", "How do I order?"];
      } else {
        message = "I'm not sure I understood that. I can help with product information, reference prices, availability, delivery areas, and order inquiries. Or I can connect you with the seller.";
        suggestions = DEFAULT_SUGGESTIONS;
      }
    }
  }

  if (!message) {
    message = "Could you tell me which product you're interested in? I can share details, prices, and availability.";
    attachments.push(productCardsFor(ctx.products));
  }

  return finish(analysis);

  function finish(finalAnalysis: AIAnalysis): EngineReply {
    return {
      message,
      attachments,
      suggestions,
      analysis: finalAnalysis,
      state: next,
    };
  }
}

export function productContextGreeting(product: Product) {
  return {
    message: `Hi! I see you're looking at ${product.name}. I can share its details, reference price, availability, or help you send an order inquiry. What would you like to know?`,
    suggestions: ["How much is it?", "How do I prepare it?", "Is it available?", "Compare with similar"],
  };
}
