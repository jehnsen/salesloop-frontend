import type { AIActivity, AIAgentConfig } from "@/types";
import { hoursAgo, minutesAgo } from "./time";

export const aiAgentConfig: AIAgentConfig = {
  name: "AI Sales Assistant",
  active: true,
  autonomy: "semi_automatic",
  greeting:
    "Hi! I'm the Luntian Wellness AI assistant. I can help you find products, compare options, check availability, and send an order inquiry to the seller.",
  responseLanguage: "auto",
  capabilities: [
    { id: "product_qa", label: "Product Q&A", description: "Answers questions using approved product information.", enabled: true },
    { id: "product_comparison", label: "Product Comparison", description: "Explains differences between similar products.", enabled: true },
    { id: "lead_capture", label: "Lead Capture", description: "Asks for name and mobile when a customer shows interest.", enabled: true },
    { id: "lead_qualification", label: "Lead Qualification", description: "Scores leads by product, quantity, location, and intent.", enabled: true },
    { id: "product_recommendation", label: "Product Recommendation", description: "Suggests products based on taste and routine.", enabled: true },
    { id: "order_inquiry_assistance", label: "Order Inquiry Assistance", description: "Prepares order inquiries for the seller to confirm.", enabled: true },
    { id: "follow_up_suggestions", label: "Follow-Up Suggestions", description: "Creates follow-up tasks with suggested messages.", enabled: true },
    { id: "human_handoff", label: "Human Handoff", description: "Routes conversations to you when needed.", enabled: true },
  ],
  guardrails: [
    { id: "no_medical_claims", label: "Never make medical claims", description: "Blocks replies saying a product cures, treats, or prevents disease.", enabled: true, critical: true },
    { id: "no_invented_prices", label: "Never invent prices", description: "Only quotes prices from the product catalog, labelled as reference prices.", enabled: true, critical: true },
    { id: "no_invented_stock", label: "Never invent stock", description: "Only reports stock status from the product catalog.", enabled: true, critical: true },
    { id: "approved_knowledge_only", label: "Only use approved product knowledge", description: "Ignores products and sources not marked 'Approved for AI'.", enabled: true, critical: true },
    { id: "escalate_medical", label: "Escalate medical questions", description: "Hands health questions to you and recommends a healthcare professional.", enabled: true, critical: true },
    { id: "escalate_complaints", label: "Escalate complaints", description: "Routes complaints and delivery issues to you.", enabled: true, critical: false },
    { id: "escalate_refunds", label: "Escalate refund requests", description: "Never promises refunds. Always routes to you.", enabled: true, critical: false },
    { id: "approve_promotions", label: "Require approval before sending promotional messages", description: "Promotional or broadcast messages wait for your approval.", enabled: true, critical: false },
  ],
};

export const aiActivity: AIActivity[] = [
  { id: "act_001", timestamp: minutesAgo(30), type: "detected_reorder", customerName: "Maria Santos", customerId: "cus_001", action: "Detected reorder request", reasoning: "Customer said \"pa-order ulit\" and matches her usual 3-box order of Lingzhi 3-in-1.", result: "Reorder request sent to seller", status: "escalated" },
  { id: "act_002", timestamp: minutesAgo(61), type: "escalated", customerName: "Lovely Manalo", leadId: "led_012", action: "Escalated conversation to seller", reasoning: "Delivery complaint detected. Complaint guardrail requires human handling.", result: "Seller notified", status: "escalated" },
  { id: "act_003", timestamp: minutesAgo(131), type: "blocked_claim", customerName: "Miguel Torres", leadId: "led_007", action: "Referred to healthcare professional", reasoning: "Customer asked if RG is safe with maintenance medicine. Medical guardrail: no medical advice.", result: "Safe response sent and conversation escalated", status: "escalated" },
  { id: "act_004", timestamp: minutesAgo(180), type: "created_follow_up", customerName: "Kristine Bautista", leadId: "led_001", action: "Created follow-up task", reasoning: "High intent (3 boxes, location given) but no order confirmation after 1 hour.", result: "Follow-up scheduled today at 2:00 PM", status: "completed" },
  { id: "act_005", timestamp: minutesAgo(192), type: "captured_lead", customerName: "Kristine Bautista", leadId: "led_001", action: "Captured a new lead", reasoning: "Customer shared name and mobile number during a price inquiry.", result: "Lead created with score 87", status: "completed" },
  { id: "act_006", timestamp: minutesAgo(210), type: "detected_high_intent", customerName: "Kristine Bautista", leadId: "led_001", action: "Detected high purchase intent", reasoning: "Quantity (3 boxes) and location (Quezon City) provided.", result: "Lead score raised to 83", status: "completed" },
  { id: "act_007", timestamp: minutesAgo(239), type: "answered_inquiry", customerName: "Kristine Bautista", leadId: "led_001", action: "Answered price inquiry", reasoning: "Quoted catalog reference price for Lingzhi Coffee 3-in-1.", result: "Asked for location", status: "completed" },
  { id: "act_008", timestamp: minutesAgo(569), type: "answered_inquiry", customerName: "Patricia Ramos", leadId: "led_005", action: "Answered product inquiry", reasoning: "Shared approved ingredients. Suitability-for-kids question: added pediatrician note.", result: "Customer engaged", status: "completed" },
  { id: "act_009", timestamp: hoursAgo(15), type: "recommended_product", customerName: "Hazel Robles", leadId: "led_013", action: "Recommended Spica Tea", reasoning: "Customer asked for a light evening drink.", result: "Mobile number captured", status: "completed" },
  { id: "act_010", timestamp: hoursAgo(20), type: "drafted_message", customerName: "Carlo Reyes", leadId: "led_002", action: "Drafted follow-up reply", reasoning: "Conversation is in Draft Only mode. Suggested a 1-box trial of Black Coffee.", result: "Waiting for seller approval", status: "pending_approval" },
  { id: "act_011", timestamp: hoursAgo(21), type: "recommended_product", customerName: "Carlo Reyes", leadId: "led_002", action: "Recommended Lingzhi Black Coffee", reasoning: "Customer prefers less sweet coffee; Black Coffee has no sugar or creamer.", result: "Customer considering", status: "completed" },
  { id: "act_012", timestamp: hoursAgo(28), type: "recommended_product", customerName: "Jomar Dizon", leadId: "led_006", action: "Recommended Lingzhi Coffee 3-in-1", reasoning: "Price objection on Cordyceps Coffee. Suggested a lower-priced alternative.", result: "No reply yet", status: "completed" },
  { id: "act_013", timestamp: hoursAgo(29), type: "detected_high_intent", customerName: "Bea Santiago", leadId: "led_004", action: "Detected high purchase intent", reasoning: "Customer specified 3 White Coffee + 2 Soap and location Marikina.", result: "Order inquiry created", status: "completed" },
  { id: "act_014", timestamp: hoursAgo(31.9), type: "answered_inquiry", customerName: "Arnel Mercado", leadId: "led_011", action: "Compared RG and GL", reasoning: "Used approved label information only. No health claims.", result: "Customer sent order inquiry", status: "completed" },
  { id: "act_015", timestamp: hoursAgo(52), type: "answered_inquiry", customerName: "Nico Fernandez", leadId: "led_014", action: "Answered availability inquiry", reasoning: "Ganozhi Shampoo is out of stock per catalog.", result: "Restock notification requested", status: "completed" },
  { id: "act_016", timestamp: hoursAgo(72), type: "detected_reorder", customerName: "Ana Cruz", customerId: "cus_002", action: "Detected likely reorder opportunity", reasoning: "Cocozhi reorder cycle ~33 days; day 30 reached.", result: "Follow-up suggested for tomorrow", status: "completed" },
];
