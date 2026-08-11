# Fixes required for repository to work reliably

- Firebase / env
  - Ensure `.env.local` populated (see [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)) and required NEXT_PUBLIC_* vars set.
- Firestore security rules
  - Enforce employer-only conversation creation and proper read/write for conversation messages. Update [firestore.rules](firestore.rules).
- Thread limits & billing
  - Implement `THREAD_LIMITS` usage in [`startConversation`](src/lib/firestore.ts) and make it configurable via user `subscriptionTier`. Add `src/lib/billing.ts` (Task 8). ([task_8.md](task_8.md))
- Missing helpers listed in tasks
  - Add `logJobView`, `getJobViewCount`, `getJobConversationCount`, `getJobPingCount` to [`src/lib/firestore.ts`] (referenced in [task_7.md](task_7.md)). ([src/lib/firestore.ts](src/lib/firestore.ts))
- Profile enforcement
  - Prevent job posting if `employerProfiles/{uid}` missing — update [src/app/dashboard/post-job/page.tsx] and [src/app/dashboard/setup/page.tsx]. ([src/app/dashboard/setup/page.tsx](src/app/dashboard/setup/page.tsx))
- Real-time messaging
  - Use `onSnapshot` in `MessageThread` and conversation list components. ([src/components/shared/message-thread.tsx](src/components/shared/message-thread.tsx))
- Pagination & large lists
  - Implement cursor-based pagination in [`src/lib/firestore.ts`] and update UI (My Jobs, Workers lists). ([src/app/dashboard/my-jobs/page.tsx](src/app/dashboard/my-jobs/page.tsx))
- Dev fallback handling
  - Make mock/fallback behavior explicit and toggleable when Firebase not configured (several pages mention mock data).
- Error handling & loading states
  - Add skeletons and retry actions across critical pages: job posting, pinging, conversation creation. See [task_5.md](task_5.md) and [task_7.md](task_7.md).
- Indexes & queries
  - Deploy composite indexes required by queries flagged in README and add index definitions.
- Tests & CI
  - Add unit tests for firestore helpers and billing functions; add CI workflow.
- Webhook & server route
  - Add webhook skeleton: `src/app/api/billing/webhook/route.ts` (or old pages API) for Stripe in production. ([task_8.md](task_8.md))

Files to edit (short list):
- [src/lib/firestore.ts](src/lib/firestore.ts)
- [src/lib/types.ts](src/lib/types.ts)
- [src/app/dashboard/profile/page.tsx](src/app/dashboard/profile/page.tsx)
- [src/app/worker/messages/page.tsx](src/app/worker/messages/page.tsx)
- [firestore.rules](firestore.rules)
- [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)