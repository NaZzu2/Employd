# Overview — what the app currently does

- Two-sided marketplace UI:
  - Employer area under `/dashboard/*` (desktop/sidebar): posting jobs, viewing pings, managing conversations. See [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx).
  - Worker area unified under `/worker/*` (mobile-first): job feed, messages, profile with bottom nav. See [src/app/worker/layout.tsx](src/app/worker/layout.tsx) and [src/components/worker/worker-bottom-nav.tsx](src/components/worker/worker-bottom-nav.tsx).
- Messaging & pings
  - Workers "Ping" job posts; employers convert pings or start conversations. Messaging components exist: `MessageThread` and conversation pages. Relevant helpers in [src/lib/firestore.ts](src/lib/firestore.ts) (e.g., `getOrCreateConversation`, `getUserDoc`). See Task notes in [task_2.md](task_2.md).
- Reviews & badges
  - Reviews require a completed contract; a single badge is chosen per review and aggregates to `badgeCounts` on user profiles. See `BadgeDisplay` and `review-form` components (shared).
- Mock data & Finnish seed
  - Local mock Finnish data exists in [`src/lib/data.ts`] and seeding script. ([src/lib/data.ts](src/lib/data.ts), [scripts/seed-finnish-data.js](scripts/seed-finnish-data.js))
- Firebase integration
  - Firestore + Auth expected; many firestore helpers are implemented in [`src/lib/firestore.ts`]. App supports mock fallback when Firebase not configured. Deployment and setup docs in [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) and [README.md](README.md).
- Current gaps
  - Subscription/billing UI is planned but not fully implemented (see [task_8.md](task_8.md)).
  - A few helper functions and analytics counters are missing and listed in [task_7.md](task_7.md).

Key files to inspect:
- [src/lib/firestore.ts](src/lib/firestore.ts)
- [src/lib/types.ts](src/lib/types.ts)
- [src/app/worker/layout.tsx](src/app/worker/layout.tsx)
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
- [task_2.md](task_2.md), [task_3.md](task_3.md), [task_7.md](task_7.md), [task_8.md](task_8.md)