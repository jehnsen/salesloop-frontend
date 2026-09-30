import type { AIAnalysis, ChatMessage, ChatRole, Conversation } from "@/types";
import { minutesAgo } from "./time";

let counter = 0;
function msg(
  role: ChatRole,
  message: string,
  minutes: number,
  extra: Partial<Pick<ChatMessage, "analysis" | "isDraft">> = {},
): ChatMessage {
  counter += 1;
  return { id: `msg_${String(counter).padStart(4, "0")}`, role, message, timestamp: minutesAgo(minutes), ...extra };
}

function a(analysis: AIAnalysis): Pick<ChatMessage, "analysis"> {
  return { analysis };
}

function lastAnalysis(messages: ChatMessage[]) {
  return [...messages].reverse().find((m) => m.analysis)?.analysis;
}

function conversation(c: Omit<Conversation, "lastMessageAt" | "latestAnalysis">): Conversation {
  const last = c.messages[c.messages.length - 1];
  return { ...c, lastMessageAt: last.timestamp, latestAnalysis: lastAnalysis(c.messages) };
}

export const conversations: Conversation[] = [
  conversation({
    id: "cnv_001",
    customerName: "Kristine Bautista",
    leadId: "led_001",
    channel: "website",
    status: "ai_handling",
    aiMode: "auto_reply",
    unread: 0,
    messages: [
      msg("customer", "Hi! Magkano Lingzhi Coffee? Maybe kukuha ako tatlo.", 240, a({
        intent: "price_inquiry", confidence: 0.94, purchaseIntent: "high", products: ["lingzhi-coffee-3-in-1"],
        quantity: 3, leadScore: 74, nextAction: "ask_location",
      })),
      msg("assistant", "We currently have Lingzhi Coffee 3-in-1 available at a reference price of ₱650 per box. You're considering 3 boxes—is that correct? I can also help check delivery availability. What city or municipality are you located in?", 239),
      msg("customer", "Yes 3 boxes. Quezon City ako.", 210, a({
        intent: "buy_product", confidence: 0.91, purchaseIntent: "high", products: ["lingzhi-coffee-3-in-1"],
        quantity: 3, location: "Quezon City", leadScore: 83, nextAction: "capture_contact",
      })),
      msg("assistant", "Great, we deliver to Quezon City. For 3 boxes the reference total is ₱1,950 before delivery. The seller will confirm the final amount and schedule. May I have your name and mobile number so the seller can reach you?", 209),
      msg("customer", "Kristine, 0917 123 4567. Magkano delivery fee?", 192, a({
        intent: "shipping_inquiry", confidence: 0.88, purchaseIntent: "high", products: ["lingzhi-coffee-3-in-1"],
        quantity: 3, location: "Quezon City", leadScore: 87, nextAction: "create_order_inquiry",
        objections: ["Asked about the delivery fee"],
      })),
      msg("assistant", "Thanks, Kristine! Delivery fees depend on your exact area, so the seller will confirm it with you shortly. Would you like me to send an order inquiry for 3 boxes now?", 191),
    ],
  }),
  conversation({
    id: "cnv_002",
    customerName: "Carlo Reyes",
    leadId: "led_002",
    channel: "messenger",
    status: "seller_handling",
    aiMode: "draft_only",
    unread: 0,
    messages: [
      msg("customer", "Ano difference ng black coffee at 3-in-1?", 1320, a({
        intent: "product_comparison", confidence: 0.93, purchaseIntent: "medium",
        products: ["lingzhi-black-coffee", "lingzhi-coffee-3-in-1"], leadScore: 55, nextAction: "compare_products",
      })),
      msg("assistant", "Black coffee has a simpler coffee profile, while 3-in-1 includes additional ingredients for a creamier and sweeter taste. Would you like me to compare the available options?", 1319),
      msg("customer", "Hindi ako mahilig sa matamis. Alin mas okay?", 1260, a({
        intent: "product_inquiry", confidence: 0.86, purchaseIntent: "medium", products: ["lingzhi-black-coffee"],
        leadScore: 68, nextAction: "recommend_product", objections: ["Doesn't like sweet coffee"],
      })),
      msg("assistant", "If you prefer less sweet coffee, Lingzhi Black Coffee is a good fit. It has no sugar or creamer, so you can adjust it yourself. A box has 30 sachets at a reference price of ₱620.", 1259),
      msg("customer", "Sige, pag-iisipan ko muna. Thanks!", 1200, a({
        intent: "general_question", confidence: 0.72, purchaseIntent: "medium", products: ["lingzhi-black-coffee"],
        leadScore: 72, nextAction: "answer_question", objections: ["Undecided"],
      })),
      msg("assistant", "No problem, Carlo! Take your time. If it helps, you can start with just 1 box of Black Coffee to try. Just message me when you're ready.", 60, { isDraft: true }),
    ],
  }),
  conversation({
    id: "cnv_003",
    customerName: "Maria Santos",
    customerId: "cus_001",
    channel: "messenger",
    status: "needs_seller",
    aiMode: "auto_reply",
    unread: 1,
    messages: [
      msg("customer", "Hi Rhea! Pa-order ulit ng Lingzhi 3-in-1, same as before.", 42, a({
        intent: "reorder", confidence: 0.96, purchaseIntent: "high", products: ["lingzhi-coffee-3-in-1"],
        quantity: 3, location: "Quezon City", leadScore: 95, nextAction: "offer_reorder",
      })),
      msg("assistant", "Welcome back, Maria! Same as last time—3 boxes of Lingzhi Coffee 3-in-1 delivered to Quezon City? I've passed this to Rhea so she can confirm the total and delivery schedule.", 41),
      msg("system", "AI created a reorder request and notified the seller.", 41),
      msg("customer", "Yes po, Saturday sana ulit.", 30, a({
        intent: "buy_product", confidence: 0.9, purchaseIntent: "high", products: ["lingzhi-coffee-3-in-1"],
        quantity: 3, location: "Quezon City", leadScore: 96, nextAction: "escalate_to_seller", escalate: true,
      })),
    ],
  }),
  conversation({
    id: "cnv_004",
    customerName: "Miguel Torres",
    leadId: "led_007",
    channel: "website",
    status: "needs_seller",
    aiMode: "auto_reply",
    unread: 2,
    messages: [
      msg("customer", "Pwede ba ang RG sa may high blood? May maintenance ako.", 132, a({
        intent: "medical_question", confidence: 0.97, purchaseIntent: "low", products: ["rg-reishi-gano"],
        leadScore: 38, nextAction: "suggest_consulting_professional", medicalFlag: true, escalate: true,
      })),
      msg("assistant", "Thanks for asking. I can't give medical advice, and RG is a food supplement—not a medicine or a replacement for your maintenance medication. Please consult a qualified healthcare professional before taking any supplement with your medicine. I can share the product label details, and I've let the seller know you have a question.", 131),
      msg("system", "Health-related question detected. Conversation escalated to seller.", 131),
      msg("customer", "Okay, pa-send nalang ng label details.", 120),
    ],
  }),
  conversation({
    id: "cnv_005",
    customerName: "Bea Santiago",
    leadId: "led_004",
    channel: "messenger",
    status: "seller_handling",
    aiMode: "draft_only",
    unread: 0,
    messages: [
      msg("customer", "Available pa ba white coffee?", 1800, a({
        intent: "availability_inquiry", confidence: 0.92, purchaseIntent: "medium", products: ["white-coffee-zhino"],
        leadScore: 60, nextAction: "ask_quantity",
      })),
      msg("assistant", "Yes, White Coffee Zhino is available! How many boxes would you like? Many customers also add Ganozhi Soap to their order.", 1799),
      msg("customer", "3 boxes, tapos 2 soap. Marikina ako.", 1700, a({
        intent: "buy_product", confidence: 0.95, purchaseIntent: "high", products: ["white-coffee-zhino", "ganozhi-soap"],
        quantity: 3, location: "Marikina", leadScore: 84, nextAction: "create_order_inquiry",
      })),
      msg("assistant", "Got it: 3 White Coffee Zhino and 2 Ganozhi Soap for delivery to Marikina. I've sent your order inquiry to the seller for confirmation.", 1699),
      msg("seller", "Hi Bea! Rhea here. Total is ₱2,430 + ₱80 delivery. GCash: 0917 000 0000 (R. Bautista). Please send a screenshot once paid. Salamat!", 1080),
    ],
  }),
  conversation({
    id: "cnv_006",
    customerName: "Patricia Ramos",
    leadId: "led_005",
    channel: "website",
    status: "ai_handling",
    aiMode: "auto_reply",
    unread: 0,
    messages: [
      msg("customer", "Is Cocozhi okay for kids? 6 and 9 years old.", 570, a({
        intent: "product_inquiry", confidence: 0.84, purchaseIntent: "medium", products: ["cocozhi-cocoa-drink"],
        leadScore: 58, nextAction: "answer_question", medicalFlag: true, objections: ["Suitability for kids"],
      })),
      msg("assistant", "Cocozhi is a cocoa drink made with sugar, non-dairy creamer, cocoa powder, and Ganoderma extract. Many families serve it as a chocolate drink, but for questions about your children's diet or allergies, please consult your pediatrician. Would you like to know the price or how many cups a box makes?", 569),
    ],
  }),
  conversation({
    id: "cnv_007",
    customerName: "Jomar Dizon",
    leadId: "led_006",
    channel: "instagram",
    status: "ai_handling",
    aiMode: "auto_reply",
    unread: 0,
    messages: [
      msg("customer", "hm cordyceps coffee", 1800, a({
        intent: "price_inquiry", confidence: 0.89, purchaseIntent: "medium", products: ["cordyceps-coffee-3-in-1"],
        leadScore: 40, nextAction: "ask_quantity",
      })),
      msg("assistant", "Cordyceps Coffee 3-in-1 has a reference price of ₱720 for a box of 20 sachets (about ₱36 per cup). Stock is limited right now. How many boxes are you thinking of?", 1799),
      msg("customer", "medyo mahal pala hehe", 1680, a({
        intent: "price_inquiry", confidence: 0.7, purchaseIntent: "low", products: ["cordyceps-coffee-3-in-1"],
        leadScore: 45, nextAction: "recommend_product", objections: ["Price concern"],
      })),
      msg("assistant", "I understand! If you'd like a lower starting point, Lingzhi Coffee 3-in-1 is ₱650 per box and has a similar creamy taste. You can also start with just 1 box to try.", 1679),
    ],
  }),
  conversation({
    id: "cnv_008",
    customerName: "Nico Fernandez",
    leadId: "led_014",
    channel: "website",
    status: "resolved",
    aiMode: "auto_reply",
    unread: 0,
    messages: [
      msg("customer", "May stock pa ng Ganozhi shampoo? 2 bottles sana", 3120, a({
        intent: "availability_inquiry", confidence: 0.93, purchaseIntent: "medium", products: ["ganozhi-shampoo"],
        quantity: 2, leadScore: 50, nextAction: "capture_contact",
      })),
      msg("assistant", "Ganozhi Shampoo is currently out of stock and being restocked. I can have the seller notify you as soon as it's back. Would you like that?", 3119),
      msg("customer", "Sige, pa-notify nalang.", 3100),
      msg("assistant", "Done! The seller will message you once Ganozhi Shampoo is available again.", 3099),
    ],
  }),
  conversation({
    id: "cnv_009",
    customerName: "Lovely Manalo",
    leadId: "led_012",
    customerId: "cus_013",
    channel: "messenger",
    status: "needs_seller",
    aiMode: "auto_reply",
    unread: 1,
    messages: [
      msg("customer", "Hi, 3 days na po wala pa yung order ko. Saan na kaya?", 62, a({
        intent: "complaint", confidence: 0.9, purchaseIntent: "high", products: ["spirulina-cereal"],
        location: "Bulacan", leadScore: 88, nextAction: "escalate_to_seller", escalate: true,
        objections: ["Delivery delay"],
      })),
      msg("assistant", "Sorry for the wait, Lovely! Your order was shipped by courier to Bulacan. I've flagged this to Rhea so she can check the tracking and update you personally.", 61),
      msg("system", "Complaint detected. Conversation escalated to seller.", 61),
    ],
  }),
];
