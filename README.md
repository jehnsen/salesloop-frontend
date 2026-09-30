# SalesLoop: AI-powered direct-selling frontend

Frontend for an independent DXN reseller, **Luntian Wellness**: a product-discovery storefront with an AI sales assistant, plus a seller CRM ("SalesLoop" admin) for leads, conversations, follow-ups, orders, and marketing.

There is no backend yet. Everything runs on realistic Philippine mock data behind a service layer built to be swapped for a Node.js/PostgreSQL API.match the 

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

- Customer site: `/`
- Seller admin: `/admin` (redirects to `/login`; sample credentials are shown on the login page: `seller@luntianwellness.example` / `Salesloop#2026`)

Stack: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Radix UI primitives (shadcn-style components in `components/ui`), Lucide icons, Recharts, Sonner toasts.

## Try the demo flow

1. Open a product, e.g. `/products/lingzhi-coffee-3-in-1`, and click **Ask AI About This Product**.
2. Type `Magkano? Kukuha ako tatlo.`, then `Quezon City`.
3. Fill in the lead form in the chat, then click **Send order inquiry** (it arrives pre-filled) and submit.
4. Open `/admin/leads`, `/admin/conversations`, and `/admin/orders`: the new lead, the mirrored chat with AI analysis, and the order inquiry are all there.

Other phrases worth trying: `Ano difference ng black coffee at 3-in-1?`, `Pwede ba ang RG sa may diabetes?` (medical guardrail), `Talk to seller`, `Gusto ko ng refund` (complaint escalation), `Hindi ako mahilig sa matamis` (recommendation).

Admin changes, captured leads, and orders are saved in **your browser's localStorage**. Use *Settings → Reset demo data* (or the avatar menu) to start over.

## Project structure

```
app/
  (site)/            Customer website (home, products, categories, blog, ai-assistant, order-inquiry, legal…)
  admin/             Seller dashboard (dashboard, leads, customers, conversations, follow-ups, orders,
                     products, ai-agent, content, campaigns, analytics, settings)
components/
  ui/                Design-system primitives (button, dialog, sheet, tabs, switch…)
  shared/            Cross-app pieces (DataTable, FilterChips, EmptyState, Timeline, status badges, ConfirmDialog…)
  layout/            Header, footer, container, section headers, brand
  site/              Storefront components (ProductCard, ProductImage, catalog, order form…)
  chat/              AI assistant (provider, floating widget, panel, bubbles, attachments)
  admin/             Dashboard shell, charts, CRM widgets, forms
lib/
  mock-data/         ALL seed data (products, leads, customers, orders, conversations…) and the mock store
  ai/                Mock AI engine (intent/entity extraction, replies) and reorder prediction
  constants.ts       Labels for every enum shown in the UI
  hooks/             useAsync, useDbChange, useProductLookup
services/            Async service layer (the only thing components call)
types/               Domain models, including the AI message structure
```

## Service layer → backend

Components never import mock data directly for records; they call `services/*`:

| Service | Examples |
|---|---|
| `products.ts` | `getProducts(query)`, `getProductBySlug`, `createProduct`, `setProductAIApproval` |
| `leads.ts` | `getLeads(filters)`, `getLeadById`, `updateLeadStage`, `captureLeadFromChat`, `convertLeadToCustomer` |
| `customers.ts` | `getCustomers`, `getCustomerById`, `getReorderOpportunities`, `snoozeReorder` |
| `conversations.ts` | `getConversations`, `sendSellerMessage`, `generateDraftReply`, `approveDraft`, `setConversationMode` |
| `orders.ts` | `createOrderInquiry`, `updateOrderStatus` |
| `followups.ts` | `getFollowUps`, `createFollowUp`, `completeFollowUp` |
| `campaigns.ts`, `content.ts` | campaigns, content items, mock `generateContent` |
| `analytics.ts` | `getDashboardSummary`, `getAnalytics(range)` |
| `ai-agent.ts` | `sendCustomerMessage`, `submitChatLeadForm`, `getAgentConfig`, guardrails, activity log |

Every function is async and returns cloned data after simulated latency (`services/_mock.ts`). To connect a real API, replace the function bodies with `fetch` calls that return the same types; pages and components stay unchanged. `lib/mock-data/store.ts` can then be deleted.

## The AI assistant (mocked)

`lib/ai/mock-engine.ts` is a rule-based stand-in for an LLM + RAG pipeline. It returns the same structured output a model would return via tool calling:

```ts
interface AIAnalysis {
  intent: AIIntent;            // price_inquiry, buy_product, product_comparison, medical_question…
  confidence: number;
  purchaseIntent: "low" | "medium" | "high";
  products: string[];          // detected product slugs (aliases supported, e.g. "3in1", "lingzhi")
  quantity?: number;           // "tatlo", "3 boxes", "x3"
  location?: string;           // PH cities/municipalities, "QC"
  leadScore?: number;
  nextAction?: AINextAction;   // ask_location, capture_contact, escalate_to_seller…
  medicalFlag?: boolean;
  escalate?: boolean;
}
```

- It answers **only from approved product data** (price, stock status, ingredients, preparation). Products not marked *Approved for AI* are refused and escalated.
- Admin controls take effect in the chat: capabilities, guardrails, pausing the agent, and **Assist Only** autonomy (the customer gets a holding reply and the AI answer waits in the inbox as a draft).
- AI metadata is **hidden from customers**. It appears in the admin inbox, lead pages, and the AI Agent test sandbox. In `next dev`, a collapsible "AI analysis (dev only)" inspector also shows under chat messages (`NEXT_PUBLIC_AI_DEBUG=true` in `.env.development`; production builds hide it).

## Compliance

- No cure/treat/prevent claims anywhere; supplements carry the PH "No approved therapeutic claims" notice.
- Health questions trigger: *"Please consult a qualified healthcare professional for medical advice."* The product editor also warns when copy contains claim words.
- The site states it is run by an independent distributor, not the official DXN website (footer, About, Terms, Disclaimer, editable in Settings).
- Prices are labelled **reference prices**. There is no checkout: every order is an inquiry the seller confirms.

## Limitations and placeholders to replace before launch

- **Mock authentication** only: `/login` checks a hard-coded sample credential (`services/auth.ts`) and stores a flag in localStorage. Replace with real sessions and middleware when the backend exists.
- **Mock persistence** is per-browser localStorage. Settings edits affect the admin and the AI chat but not the server-rendered storefront copy (which reads `lib/mock-data/site.ts`).
- **Product photos** are drawn SVG placeholders (`components/site/product-image.tsx`). Swap in real images.
- **Prices, distributor ID, contact details, and social links** are placeholders.
- **Testimonials** are labelled sample content. Replace them with real, consented reviews.
- **Legal pages** are templates; have them reviewed.
- DXN and product names are trademarks of their owners; confirm your distributor's branding rules.
