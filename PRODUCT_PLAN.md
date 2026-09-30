- [x] Deploy the two employer/worker contract-status indexes; Firebase reports both `READY` in project `employ-d`.
# Employ'd Product and MVP Implementation Plan

> This is the canonical product/MVP plan, consolidating the former `implementation_plan.md`, `MVP_PLAN.md`, and `MVP.md`. It records current intended behavior, what is implemented in this repository, and what remains before a production MVP. The broader post-MVP backlog remains in [TASKS.md](TASKS.md), and the long-term hardening roadmap remains in [PLAN.md](PLAN.md).

**Last reconciled:** 2026-09-30

## Product Goal

Employ'd is a two-sided hiring marketplace:

- Employers use a desktop-oriented dashboard to publish jobs, find workers, initiate conversations, hire, and review.
- Employees use a mobile-oriented experience to manage a profile, find and ping jobs, respond to employer-initiated conversations, accept contracts, and review employers.

The MVP core loop is signup -> profile -> job/ping -> conversation -> accepted contract -> reviews. Contracts are non-legal records of hiring intent; the product does not provide e-signature or legal/HR services.

## Product Decisions

- Firebase Authentication uses email/password. The role is `employer` or `worker` in `users/{uid}`; "employee" is the user-facing term for the worker role.
- Employer chat initiation is required. Employees can reply after an employer creates the thread; employees express initial interest with a job ping.
- Once a worker accepts an employer's contract, the conversation for that pair becomes read-only and remains visible.
- Either party may review the other after contract acceptance (`active` or `completed`). A reviewer may submit only one review per contract. This is enforced by Firestore rules using a deterministic document ID: `{contractId}_{reviewerUid}`. A badge is optional; when selected, tier limits are currently checked client-side.
- Reviews use a 1-5 star rating, an optional comment (maximum 500 characters), and optional badges from `punctual`, `reliable`, `quality`, `professional`, and `goes_above`. The free tier allows one badge; higher tiers allow more.
- The employee bottom navigation is `Jobs`, `Messages`, `Contracts`, `Reviews`, `Profile`. The Home experience is disabled; `/worker` redirects to `/worker/jobs`.
- Free/pro/enterprise tier fields and limits exist, but real payment processing is outside MVP scope. The subscription UI may use its mock flow.
- PWA/offline support, automated test suite, CI, AI recommendations, advanced analytics, and server-side badge-limit enforcement are deferred.

## Routes and Experience

### Employer

- `/dashboard` and `/dashboard/workers`: worker discovery and profile browsing.
- `/dashboard/my-jobs`, `/dashboard/post-job`, and job detail routes: create, manage, and close job posts; view interested workers.
- `/dashboard/pings`: review worker interest and respond.
- `/dashboard/messages` and `/dashboard/messages/[conversationId]`: employer-initiated conversations.
- `/dashboard/contracts`: manage contracts and mark work complete.
- `/dashboard/reviews`: received reviews and reviews to give.
- `/dashboard/profile` and `/dashboard/subscriptions`: company profile and subscription UI.

The employer layout is desktop-oriented with a sidebar.

### Employee

- `/worker` redirects to `/worker/jobs`.
- `/worker/jobs`: searchable active-job board with ping actions.
- `/worker/messages` and `/worker/messages/[conversationId]`: replies in employer-created conversations.
- `/worker/contracts`: accept/decline contracts and view contract status.
- `/worker/reviews`: review employers, view received reviews and badges, and see pending contract actions.
- `/worker/my-profile`: manage worker profile.

The employee layout is mobile-oriented, constrained to phone width on desktop, with a fixed bottom navigation in the exact order `Jobs` -> `Messages` -> `Contracts` -> `Reviews` -> `Profile`.

## Data and Core Rules

Firestore is the application data store. The principal collections are:

| Collection/path | Purpose and key data |
|---|---|
| `users/{uid}` | Role, contact/display details, subscription tier, rating and badge aggregates |
| `employerProfiles/{uid}` | Company name, industry, location, description, website, reputation aggregates |
| `workerProfiles/{uid}` | Title, location, summary, skills, experience, education, availability and reputation aggregates |
| `jobPosts/{jobId}` | Employer, company, title, location, type, salary, description, requirements and status |
| `pings/{pingId}` | Worker interest in a job, employer, message and response status |
| `conversations/{conversationId}` | Employer/worker pair, optional job reference, timestamps and accepted-contract lock |
| `conversations/{conversationId}/messages/{messageId}` | Sender, text, timestamps and read receipt |
| `contracts/{contractId}` | Employer, worker, job, pending/active/declined/completed status and timestamps |
| `reviews/{contractId}_{reviewerUid}` | One review per party/contract: reviewer, recipient, 1-5 stars, optional badge(s)/comment and contract reference |

`functions/main.py` aggregates created reviews to the recipient's `users` document and role-specific profile. Firestore rules authorize reads/writes and validate contract participation for reviews. The deterministic review ID plus create-only access makes concurrent duplicate submissions collide at the same Firestore document; review edits are not allowed.

## Implementation Status

Status below reflects repository code and the recorded implementation notes. A checked-off code path is not a substitute for a live Firebase end-to-end or physical-device test.

### Implemented

- Firebase email/password auth, role-aware redirects, employer and employee layouts.
- Employer and worker profile create/edit paths and Firestore helpers.
- Job posting/editing/closing, worker job browsing/search, and employer worker discovery.
- Basic job view tracking and ping/conversation counts; advanced analytics are deferred.
- Worker pings with duplicate prevention and employer ping handling.
- Employer-created conversations, real-time messages, read receipts, thread limits, 2,000-character message limit (client and Firestore rules), and five-second sender cooldown (client helper only).
- Employer-created conversations, real-time messages, read receipts, per-tier thread limits (client helper only), 2,000-character message limit (client and Firestore rules), and five-second sender cooldown (client helper only).
- Employer-created contracts, worker accept/decline, employer completion, and conversation locking on acceptance.
- Review pages for both roles; reviews are available for active/completed contracts, shown on recipient profiles, and aggregated by the Firebase Function. Badge selection is optional per product decision.
- `.env.local.example` with Firebase variables and optional AI/billing variables.
- Mock subscription/billing experience. Real Stripe checkout is not an MVP requirement.
- Employee Home route disabled by redirect; requested employee tab order is in place.
- Review uniqueness is enforced in the Firestore write path by deterministic IDs and rules; existing random-ID review documents, if any, must be migrated before relying on uniqueness across historical data.
- Firestore rules now restrict user documents to their owner, prevent role/tier/reputation edits, scope profile/job/ping writes, and constrain message, conversation, and contract state changes.
- Worker job detail allows pinging but no longer exposes worker-initiated chat; ping submission stays on the job flow.
- Emulator-backed rules tests cover role immutability, private user reads, duplicate reviews, and contract participant/state transitions.
- Current rules tests also cover employer-only conversation creation, worker pings against active employer-owned jobs, post-acceptance chat locking, worker profile visibility, and closed-job access.
- `eslint-config-next` is aligned to Next.js 15 and lint uses ESLint 9 flat config; lint exits successfully with legacy warnings remaining.
- Local composite indexes include participant/status pairs for both employer and worker contract subscriptions.

### Still Required Before Calling the MVP Shipped

- [x] `npm run typecheck` and `npm run build` pass after the route and employee-flow changes.
- [x] `npm run lint` exits successfully with no errors; legacy warnings remain and should be reduced over time.
- [x] Run 10 emulator-backed Firestore rules tests in the Standard Edition emulator.
- [ ] Review remaining data minimization and abuse controls before public launch; `users/{uid}` is now owner-only, while public profile collections remain visible to authenticated users by design.
- [ ] Enforce per-tier thread quotas and the five-second message cooldown with trusted server-side logic; both are currently bypassable client-side controls.
- [ ] Run the full two-account workflow against the target Firebase project: signup, profiles, job post, worker ping, employer chat, message replies/read receipts, contract creation/acceptance, chat lock, both reviews, and updated aggregates.
- [ ] Verify the employee flow on a real phone: no horizontal overflow, usable keyboard/forms, bottom navigation unobscured, and comfortable tap targets.
- [ ] Confirm target-project Firestore rules are deployed and the `aggregate_review` Cloud Function is deployed and firing. Repository presence alone does not prove deployment.
- [ ] Inspect historical review IDs and duplicates, then migrate any random-ID records before deploying the deterministic-ID rule. This read-only check was blocked by invalid/expired OAuth credentials; no production data was read or changed.
- [ ] Deploy the updated `firestore.rules`, the `aggregate_review` Cloud Function, and the two contract-status indexes. CLI inspection found no deployed Functions, and only three remote composite indexes (five are in local config) in project `employ-d`.
- [ ] Deploy the updated `firestore.rules` after review migration inspection. The rules were emulator-tested but not deployed.
- [ ] Deploy the `aggregate_review` Cloud Function. CLI inspection found none deployed; deployment was blocked because project `employ-d` must be upgraded to Blaze to enable Artifact Registry/Cloud Build.
- [x] Deploy the two employer/worker contract-status indexes. Deployment succeeded; Firebase currently reports both as `CREATING`, so confirm they reach `READY`.
- [ ] Inspect historical review IDs and duplicates, then migrate any random-ID records before deploying the deterministic-ID rule. This read-only check was blocked by invalid/expired service-account credentials; no production data was read or changed.
- [ ] Verify production environment variables and hosting configuration, then run a production signup-to-review walkthrough.

### Deferred / Not MVP Blockers

- Broader app unit/integration tests and CI pipeline; focused Firestore rules emulator tests are now included.
- Real Stripe billing and subscription purchase flow.
- PWA installability, offline operation, and service worker.
- Server-enforced badge count limits; current plan limit is client-enforced. Badge presence itself is optional.
- AI recommendation flows, advanced analytics, and large-list pagination/performance work.
- Avatar/logo upload and other enhancements tracked in [TASKS.md](TASKS.md).

## Release Checklist

1. Complete the remaining validation items above, including the real-device pass.
2. Deploy `firestore.rules` and the Firebase Functions source to the intended project; verify runtime logs and aggregates.
3. Set production environment variables in the hosting target and verify the deployed app.
4. Complete a fresh production end-to-end walkthrough before tagging/releasing.

Do not treat local compilation as proof that Firebase rules/functions are deployed or that the mobile workflow works on a physical device.