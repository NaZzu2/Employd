# Architecture & data model

- App architecture
  - Next.js (App Router) + TypeScript + Tailwind + shadcn/ui. See [README.md](README.md).
  - Two layouts:
    - Employer desktop: `/dashboard/*` (sidebar)
    - Worker mobile: `/worker/*` (bottom-nav) — [`src/app/worker/layout.tsx`](src/app/worker/layout.tsx)
- Where data is saved
  - Cloud Firestore collections (document model). Typical collections:
    - `users/{uid}` — role, displayName, email, subscriptionTier, badgeCounts, createdAt
    - `employerProfiles/{uid}` — companyName, industry, location, description, avatarUrl, updatedAt
    - `workerProfiles/{uid}` — title, skills, location, summary, badgeCounts
    - `jobPosts/{id}` — employerId, title, description, requirements[], location, status, postedAt
    - `pings/{id}` — workerId, jobPostId, employerId, message, status, createdAt
    - `conversations/{id}` — employerId, workerId, jobPostId?, lastMessageAt
    - `conversations/{id}/messages/{msgId}` — senderId, senderRole, text, createdAt, seenAt?
    - `contracts/{id}` — employerId, workerId, jobPostId, status, createdAt
    - `reviews/{id}` — fromUid, toUid, stars, badge (one), comment, contractId, createdAt
    - Optional `jobViews` for analytics (planned)
  - Example types are documented in [`src/lib/types.ts`](src/lib/types.ts) and `implementation_plan.md`.
- Data format
  - Documents use fields (strings, numbers, arrays, ISO date strings). Timestamps are often ISO strings (convert to Firestore Timestamps recommended for analytics).
  - Badge counts are aggregated on user docs: `badgeCounts: { punctual: number, reliable: number, ... }`.
  - Subscription stored as `subscriptionTier: 'free' | 'pro' | 'enterprise'` on `users/{uid}` and `employerProfiles/{uid}`.
- Is the data usable for analysis?
  - Yes, with caveats:
    - Structured collections make analysis possible.
    - Current use of ISO strings rather than Firestore Timestamp types reduces some querying/aggregation capabilities (prefer Firestore Timestamp).
    - No exported analytics pipeline yet — recommend exporting to BigQuery via Firebase Export or Cloud Function for heavy analysis.
    - Add `jobViews` and aggregated counters (daily/monthly rollups) to avoid costly large-collection scans.
- Recommendations for analytics-readiness
  - Use Firestore server timestamps (`FieldValue.serverTimestamp()`) for event times.
  - Maintain append-only `events/` collection or `jobViews/` for behavioral tracking.
  - Add Cloud Function to update aggregated counters (per-user, per-job daily counts).
  - Define and deploy required composite indexes (see README note on indexes).

References:
- Types & plan: [src/lib/types.ts](src/lib/types.ts), [implementation_plan.md](implementation_plan.md)
- Firestore helper usage: [src/lib/firestore.ts](src/lib/firestore.ts)
- Docs: [README.md](README.md), [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)