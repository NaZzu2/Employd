# Task 8 — Subscription Upgrade: UI + Billing Flow

## Goal
Add an "Upgrade subscription" action on the Employer Profile page (above monthly threads) and build a subscription selection page so employers can upgrade their plan. Provide a clear, MVP-friendly flow (mock payments or Stripe test integration) and server-side hooks for future production usage.

---

## Prioritized Checklist

- [ ] Add `Upgrade subscription` button to the Employer Profile page
  - Place the button next to the monthly-threads badge(s) in `src/app/dashboard/profile/page.tsx`.
  - Clicking opens the subscription chooser page: `/dashboard/subscriptions`.
  - Add tooltip or helper text describing thread limits for current plan.

- [ ] Create Subscription Selection page (choose plan)
  - Create: `src/app/dashboard/subscriptions/page.tsx` (client page)
  - UI: plan cards showing `name`, `price`, `monthlyThreads`, `features` and CTA `Select` / `Upgrade`.
  - Server integration: show a mock confirmation flow by default; implement Stripe test mode as an option.

- [ ] Billing helper layer and types
  - Create: `src/lib/billing.ts` with functions:
    - `getAvailablePlans(): Promise<Plan[]>` — returns available plans (local config or remote).
    - `createCheckoutSession(userId: string, planId: string): Promise<{sessionId?: string, url?: string}>` — for Stripe or mock session.
    - `applySubscription(userId: string, planId: string): Promise<void>` — update `users` and `employerProfiles` subscription tier locally (for mock flow / after webhook).
  - Add `Plan` type in `src/lib/types.ts` (or `src/lib/billing-types.ts`) with fields: `id`, `name`, `price`, `monthlyThreads`, `features`.

- [ ] Frontend checkout flow
  - Option A (MVP mock): On select, show a confirmation modal and call `applySubscription(userId, planId)` directly.
  - Option B (Stripe test): call `createCheckoutSession`, redirect to Stripe Checkout `url` or use returned `sessionId` with Stripe.js.
  - After successful checkout, ensure `users` doc `subscriptionTier` and `monthlyThreadsStarted` limits reflect new plan.

- [ ] Webhook / server-side hook (optional for MVP)
  - Add a server endpoint (API route) to receive Stripe webhooks and call `applySubscription` when payment succeeds.
  - File: `src/pages/api/billing/webhook.ts` or `src/app/api/billing/webhook/route.ts` depending on framework choice.

- [ ] UI changes to reflect upgraded limits
  - Update components that rely on `subscriptionTier` or `THREAD_LIMITS` to read the new value from `userDoc` (no hard-coded assumptions).
  - Add an immediate optimistic update in the UI after a mock upgrade or show a status message: "Upgrade processing…"

- [ ] Feature gating for conversations/threads
  - Ensure `startConversation` (in `src/lib/firestore.ts`) enforces the `THREAD_LIMITS` using the updated `userDoc.subscriptionTier` value.
  - If user exceeds limits, show a CTA to upgrade.

- [ ] Tests and validation
  - Add unit tests for `getAvailablePlans` and `applySubscription` (mocked firestore update).
  - Add an integration smoke test for the subscription chooser page (clicking a plan uses mock flow and updates `userDoc`).

- [ ] Documentation & admin

---

Status: Implementation applied (mock flow + API routes). Unit tests still TODO.
  - Document plans in `docs/` and add `README` section on how to configure Stripe keys, test cards, and webhook URL.
  - Add environment variables used for Stripe/Mock flows to README: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BILLING_MODE` (mock|stripe).

---

## Files to Create / Modify (exact paths)

- Modify: `src/app/dashboard/profile/page.tsx` — add `Upgrade subscription` button and link to `src/app/dashboard/subscriptions`.
- Create: `src/app/dashboard/subscriptions/page.tsx` — plan listing & selection UI.
- Create: `src/lib/billing.ts` — billing helpers and wrappers.
- Update: `src/lib/types.ts` — add `Plan` type and export `THREAD_LIMITS` usage notes.
- Modify: `src/lib/firestore.ts` — ensure `startConversation` and `getUserDoc` logic reads and enforces updated `subscriptionTier`.
- Create (optional): `src/app/api/billing/webhook/route.ts` — Stripe webhook handler for production flows.
- Modify: `src/components/dashboard/*` — add small `SubscriptionBadge` / `UpgradeButton` component used in profile.

---

## Helper functions & shapes (names & file)

- `src/lib/billing.ts`
  - `export type Plan = { id: string; name: string; price: number; currency: string; monthlyThreads: number | null; features?: string[] }`
  - `export async function getAvailablePlans(): Promise<Plan[]>`
  - `export async function createCheckoutSession(userId: string, planId: string): Promise<{url?: string; sessionId?: string}>`
  - `export async function applySubscription(userId: string, planId: string): Promise<void>`

- `src/lib/types.ts` — add `Plan` export and update `UserDoc`/`EmployerProfile` optional fields `subscriptionTier?: string`.

---

## UX decisions & notes

- MVP should default to a mock flow (no payment provider) to allow quick testing; Stripe test mode can be documented and toggled via env var `BILLING_MODE`.
- When upgrading, update `users.<uid>.subscriptionTier` and `employerProfiles.<uid>.updatedAt` immediately for optimistic UI, but only finalize via webhook for Stripe.
- Ensure optimistic updates are reversible on webhook failure (log, notify user, rollback optional).

---

## Quick Developer Tasks (short step sequence)
1. Add `Plan` type and `getAvailablePlans()` returning a local array in `src/lib/billing.ts`.
2. Add `Upgrade` button to `src/app/dashboard/profile/page.tsx` linking to `/dashboard/subscriptions`.
3. Create `src/app/dashboard/subscriptions/page.tsx` with plan cards and mock upgrade flow that calls `applySubscription`.
4. Implement `applySubscription` to update `users`/`employerProfiles` documents with new `subscriptionTier` and set appropriate counters.
5. Add server webhook route skeleton for Stripe (optional for later).
6. Add tests and update documentation with env vars and setup steps.

---

If you'd like, I can now: 1) create this `task_8.md` file in the repository (I already created it), or 2) start implementing the first step (add `Upgrade` button on the `profile` page). Which should I do next?