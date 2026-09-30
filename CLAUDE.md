# CLAUDE.md

Frontend-only Next.js 15 app (customer storefront + seller admin) running on mock data. See README.md for the full overview.

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`
- Don't run `next build` while `next dev` is running: both write to `.next`.

## Conventions
- Components call `services/*` only. Never import records from `lib/mock-data` in components; the exceptions are static layout content (`siteConfig`, `categories`).
- New seed data goes in `lib/mock-data/`; the mutable store is `lib/mock-data/store.ts` (localStorage-backed in the browser).
- Enum labels live in `lib/constants.ts`. Status pills live in `components/shared/status-badges.tsx`.
- Admin pages are client components that load data with `useAsync` and refresh with `useDbChange`.
- Colours come from tokens in `app/globals.css`. Chart colours come from `CHART_COLORS` in `components/admin/charts.tsx` (validated for colour-blind separation; assign in order).
- Time-dependent text in prerendered pages must be computed after mount (avoid hydration mismatches). Format dates with `lib/utils.ts` helpers (Asia/Manila).

## Compliance rules (keep them)
- No medical claims (cure/treat/prevent) in copy or AI replies; supplements keep the "No approved therapeutic claims" notice.
- AI metadata (`ChatMessage.analysis`) must never render in customer-facing views.
- The AI answers only from products with `approvedForAI: true`.
