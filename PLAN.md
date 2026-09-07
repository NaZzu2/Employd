# Employ'd — Definitive Next-Steps Plan

> Read [CONTEXT.md](CONTEXT.md) first for full background. This file is the actionable, ordered plan. Follow steps in order. Each step lists exact files to create/edit, and an explicit "Definition of Done" (DoD) so there is no ambiguity about when a step is finished. Do not skip ahead — later steps assume earlier ones are complete.

## Current State Summary (verified from code, not assumptions)
- Data model already implemented in [src/lib/types.ts](src/lib/types.ts): `UserDoc`, `WorkerProfile`, `EmployerProfile`, `JobPost`, `Conversation`, `Message`, `Ping`, `Contract`, `Review`, badges, subscription tiers.
- Firestore CRUD/query helpers already implemented in [src/lib/firestore.ts](src/lib/firestore.ts) for users, profiles, jobs, pings, conversations, messages, contracts, reviews.
- Security rules exist in [firestore.rules](firestore.rules) covering all collections above.
- Employer dashboard (`/dashboard/*`) and worker mobile app (`/worker/*`) both exist with messaging, pings, contracts, reviews, profile pages (see [task.md](task.md), Phases 1–7 all checked complete).
- Only remaining unfinished checklist: [task_8.md](task_8.md) — Subscription/Billing upgrade flow (all boxes unchecked). Stripe dependency is installed; `src/app/api/billing/{apply,create-checkout,plans,webhook}` route folders exist but need verification/implementation.
- No automated tests exist anywhere in the repo.
- `firestore.rules` does not enforce: message text length limits, message send rate-limiting, or badge-count limits server-side (only enforced client-side in `submitReview`).

## Guiding Constraints (do not violate)
1. Contracts remain explicitly **non-legal** — never add e-signature, legal language, or binding terms UI/copy.
2. Employer surface stays under `/dashboard/*` (desktop-oriented). Employee/worker surface stays under `/worker/*` (mobile-oriented, bottom-nav). Do not merge the two layouts.
3. All new Firestore access must go through helper functions in [src/lib/firestore.ts](src/lib/firestore.ts) — never call `firebase/firestore` directly from components.
4. All new/changed collections or fields must have a matching rule block added/updated in [firestore.rules](firestore.rules) in the same step.
5. Use existing types in [src/lib/types.ts](src/lib/types.ts); extend them rather than creating parallel/duplicate types.
6. Every step that changes Firestore rules must be followed by running the emulator rule tests (Step 1) before merging.

---

## Step 0 — Baseline Verification (do this first, every session)
1. Run `npm install` if `node_modules` is missing.
2. Run `npm run typecheck` and `npm run lint`. Both must pass with zero errors before starting any new step below. Fix any pre-existing errors first and report them.
3. Run `npm run build` once to confirm the app currently builds.

**DoD:** `typecheck`, `lint`, and `build` all exit with code 0.

---

## Step 1 — Testing Foundation (blocking prerequisite for all later steps)
No test infra exists. Add it before writing more features so subsequent steps can include tests.

1. Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@firebase/rules-unit-testing`.
2. Create `vitest.config.ts` at repo root configured for the `src/` alias (`@/*` → `src/*`, matching [tsconfig.json](tsconfig.json)) and `jsdom` environment.
3. Add npm scripts to [package.json](package.json): `"test": "vitest run"`, `"test:watch": "vitest"`.
4. Create `firestore.rules.test.ts` at repo root (or `tests/firestore.rules.test.ts`) using `@firebase/rules-unit-testing` that verifies, at minimum:
   - A worker cannot create a `conversations` doc (only employers can).
   - A user cannot read another user's `contracts` doc.
   - A user cannot write a `review` with `fromUid` different from their auth uid.
5. Create one unit test for a pure function, e.g. `src/lib/utils.test.ts` testing `canStartThread` and `shouldResetMonthlyThreads` from [src/lib/utils.ts](src/lib/utils.ts).

**DoD:** `npm test` runs and passes all new tests. `firebase emulators:exec --only firestore "npm test"` also passes (requires Firebase CLI + emulator; if unavailable, document this limitation in the PR/commit message and still commit the rules test file).

---

## Step 2 — Enforce Messaging Limits Server-Side
Currently message length/rate limits are not enforced anywhere (only implied in [CONTEXT.md](CONTEXT.md)). Implement concrete, testable limits.

1. In [src/lib/types.ts](src/lib/types.ts) add constants: `export const MAX_MESSAGE_LENGTH = 2000;` and `export const MESSAGE_MIN_INTERVAL_MS = 5000;`.
2. In [src/lib/firestore.ts](src/lib/firestore.ts), in `sendMessage`:
   - Throw an `Error` if `message.text.trim().length === 0` or `message.text.length > MAX_MESSAGE_LENGTH`.
   - Before sending, query the sender's most recent message in this conversation (`orderBy('createdAt','desc')`, `limit(1)`, filtered by `senderId`). If the time since that message is less than `MESSAGE_MIN_INTERVAL_MS`, throw an `Error('You are sending messages too quickly. Please wait a moment.')`.
3. In [firestore.rules](firestore.rules), inside `conversations/{convId}/messages/{msgId}` `allow create`, add a size check: `request.resource.data.text.size() > 0 && request.resource.data.text.size() <= 2000`.
4. Update the chat input components (locate via `grep_search` for `sendMessage(` under `src/components/shared` and `src/app`) to:
   - Disable the send button while `text.length > 2000`, show a live character counter (e.g., `"1834 / 2000"`).
   - Catch and display thrown errors from `sendMessage` as toasts (use the existing toast hook in [src/hooks/use-toast.ts](src/hooks/use-toast.ts)).

**DoD:** Sending an empty message, a >2000-char message, or two messages within 5 seconds all fail with a visible, user-readable error in the UI. A rules-unit-test in Step 1's test file confirms an over-length message is rejected by `firestore.rules`.

---

## Step 3 — Finish Subscription/Billing Flow (completes [task_8.md](task_8.md))
Follow [task_8.md](task_8.md) checklist items in this exact order; check off each box in that file as completed.

1. Verify/create `src/lib/billing.ts` exporting: `getAvailablePlans()`, `createCheckoutSession(userId, planId)`, `applySubscription(userId, planId)`. Reuse the `Plan` type already defined in [src/lib/types.ts](src/lib/types.ts).
2. Verify the four route handlers under `src/app/api/billing/` (`plans`, `create-checkout`, `apply`, `webhook`) exist and are implemented; if any are stubs/empty, implement them:
   - `plans` (GET): returns `getAvailablePlans()`.
   - `create-checkout` (POST): creates a Stripe Checkout Session in test mode (or a mock session if `STRIPE_SECRET_KEY` env var is absent — must not throw, must degrade gracefully to mock mode) and returns `{ url }`.
   - `webhook` (POST): verifies Stripe signature, on `checkout.session.completed` calls `applySubscription`.
   - `apply` (POST): mock-mode direct fallback that calls `applySubscription` immediately (used when Stripe env vars are not configured).
3. Create `src/app/dashboard/subscriptions/page.tsx` (client component) if not already fully implemented: render plan cards from `getAvailablePlans()`, each with a "Select"/"Upgrade" button that calls `create-checkout` (or falls back to `apply` in mock mode) and redirects/updates accordingly.
4. Add an "Upgrade subscription" button on [src/app/dashboard/profile/page.tsx](src/app/dashboard/profile/page.tsx) next to the monthly-threads usage indicator, linking to `/dashboard/subscriptions`.
5. Ensure all UI reading `subscriptionTier` or `THREAD_LIMITS`/`BADGE_LIMITS` reads live from the user's Firestore doc (no hardcoded tier assumptions) — grep for `THREAD_LIMITS\[` and `BADGE_LIMITS\[` usages to confirm.
6. Add `.env.local.example` entries: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (check if file exists first; add if missing).
7. Write a unit test for `src/lib/billing.ts`'s `applySubscription` logic (mock Firestore calls) confirming it updates `subscriptionTier` on both `users/{uid}` and the role-specific profile doc.

**DoD:** All checkboxes in [task_8.md](task_8.md) are marked `[x]`. `npm test` includes and passes the new billing test. Manually selecting a plan on `/dashboard/subscriptions` updates the employer's `THREAD_LIMITS` usage cap visible on the profile page (verify via Firebase emulator or dev Firestore project).

---

## Step 4 — Server-Side Badge Limit Enforcement
Badge limits are currently only enforced client-side in `submitReview` ([src/lib/firestore.ts](src/lib/firestore.ts)), which a malicious client could bypass.

1. Convert badge-limit enforcement into a Cloud Function or Firestore rule check. Preferred approach for this stack (no existing Functions Node project, only `functions/main.py` in Python which appears unrelated/legacy) is a **Firestore rule-based check**:
   - In [firestore.rules](firestore.rules) under `reviews/{reviewId}` `allow create`, add a check that reads the requester's `users/{uid}` doc via `get()` and validates `request.resource.data.badges.size() <= <limit based on subscriptionTier>` (Firestore rules cannot easily do dynamic map lookups by variable key — implement via nested `request.resource.data.get('badges', []).size() <= (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.subscriptionTier == 'free' ? 1 : (... == 'pro' ? 3 : 999999))`).
2. Add a rules-unit-test (extend Step 1's test file) confirming a `free`-tier user cannot create a review with 2+ badges.

**DoD:** Rules-unit-test proves server-side rejection of over-limit badge submissions; existing client-side check in `submitReview` remains as a fast-fail UX layer (do not remove it).

---

## Step 5 — Mobile Packaging for Employee Side (PWA)
The goal states the employee side must "work on mobile phone." Currently it is a responsive web layout under `/worker/*`, not an installable app.

1. Add `public/manifest.json` with `name: "Employ'd — Worker"`, `short_name: "Employ'd"`, `start_url: "/worker"`, `display: "standalone"`, icons (reuse/generate simple icons in `public/icons/`).
2. Reference the manifest in [src/app/layout.tsx](src/app/layout.tsx) `<head>` metadata (Next.js `metadata` export) and add `theme-color`.
3. Add a minimal service worker (`public/sw.js`) for offline caching of the `/worker` shell, registered from a small client component in `src/app/worker/layout.tsx`.
4. Test installability: run `npm run build && npm run start`, open in Chrome, confirm "Install app" prompt appears when navigating to `/worker`.

**DoD:** Lighthouse PWA audit (Chrome DevTools) on `/worker` scores "installable" with no manifest/service-worker errors.

---

## Step 6 — CI Pipeline
1. Create `.github/workflows/ci.yml` running on push/PR: checkout → `npm install` → `npm run typecheck` → `npm run lint` → `npm test` → `npm run build`.

**DoD:** Workflow file present and syntactically valid (validate with a YAML linter); all steps mirror Step 0 checks.

---

## Step 7 — Documentation Sync
1. Update [CONTEXT.md](CONTEXT.md) "Recommendations / Next Steps" section to reflect whichever of Steps 1–6 are now complete, and update the messaging-limits section with the actual enforced values (2000 chars / 5s) instead of "recommended" language.
2. Update [task.md](task.md) by adding a new `## Phase 8: Hardening & Mobile Packaging` section listing Steps 1–6 above as checklist items, checking off what's done.

**DoD:** [CONTEXT.md](CONTEXT.md) and [task.md](task.md) contain no stale "recommended/TODO" language for anything actually implemented in Steps 1–6.

---

## Execution Order (strict)
Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7.

Do not reorder. If a step is blocked (e.g., no Stripe test keys available for Step 3), implement the mock-mode fallback fully, mark Stripe-live-mode parts as explicitly blocked in [task_8.md](task_8.md) with a one-line reason, and continue to Step 4.
