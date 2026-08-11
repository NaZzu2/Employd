# New ideas / improvements

- Mobile readiness
  - Worker mobile layout is present: see [`WorkerBottomNav`](src/components/worker/worker-bottom-nav.tsx) and [`WorkerLayout`](src/app/worker/layout.tsx). Verify on-device touch/viewport scaling and test Device Orientation. ([src/components/worker/worker-bottom-nav.tsx](src/components/worker/worker-bottom-nav.tsx), [src/app/worker/layout.tsx](src/app/worker/layout.tsx))
- Messaging & UX
  - Enforce employer-first thread creation in [`startConversation`](src/lib/firestore.ts) and surface upgrade CTA when limits reached. ([src/lib/firestore.ts](src/lib/firestore.ts))
  - Replace any one-shot message fetches with `onSnapshot` real-time listeners in [`MessageThread`](src/components/shared/message-thread.tsx).
- Billing & subscription
  - Implement Task 8: add [`src/lib/billing.ts`] and `/dashboard/subscriptions` UI. (see [task_8.md](task_8.md))
  - Offer mock + Stripe test mode (env var `BILLING_MODE`).
- Analytics & observability
  - Add `jobViews` writes and aggregated counters (`logJobView`, `getJobViewCount`) in [`src/lib/firestore.ts`] and export to BigQuery for analysis.
- Data model & indexing
  - Ensure queries have matching composite indexes (see README note). Add index definitions and deployment scripts.
- Reliability & errors
  - Add retry UX on Firestore errors for critical flows (`post-job`, `startConversation`, `ping`). See pages: [src/app/dashboard/post-job/page.tsx](src/app/dashboard/post-job/page.tsx) and [src/app/worker/jobs/[id]/page.tsx](src/app/worker/jobs/[id]/page.tsx).
- Security
  - Tighten `firestore.rules` to prevent workers from creating conversation docs (Task 2 A9). ([firestore.rules](firestore.rules))
- Tests & CI
  - Unit tests for `getAvailablePlans` / `applySubscription` and core firestore helpers. Add `npm run test` + CI.
- Performance & pagination
  - Add cursor pagination helpers in [`src/lib/firestore.ts`] and UI pagination on `/dashboard/my-jobs`. ([src/app/dashboard/my-jobs/page.tsx](src/app/dashboard/my-jobs/page.tsx))
- Accessibility & i18n
  - Audit keyboard navigation, aria labels on interactive components, and extract strings for translation (Finnish support already present in data).
- Docs & onboarding
  - Expand `docs/FIREBASE_SETUP.md` to include Stripe test setup and env var list. ([docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md))

References:
- Messaging & task planning: [task_2.md](task_2.md), [task_3.md](task_3.md)
- Subscription plan task: [task_8.md](task_8.md)