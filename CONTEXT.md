# Project Context — Employ'd

This file is the single canonical context summary for future queries about this repository and development tasks. Include this entire file in the context window for subsequent questions.

## Project Goal
- Build a dual-surface platform:
  - Employer side: browser-first web application (desktop/tablet-first UX) where employers post jobs, browse workers, and manage hires.
  - Employee side: mobile-first experience (phone UI) for workers to create profiles, browse gigs, communicate, and accept contracts/assignments.
- Core interactions: one-to-one messaging with limits, user profiles, reviews and badges shown on profiles, and a simple non-legal "contract"/hire record between an employer and an employee.

## High-level Architecture & Tech Stack
- Frontend: Next.js (app router), React + TypeScript, Tailwind CSS.
  - Key entry: [src/app](src/app)
  - Layouts: web/dashboards under [src/app/dashboard](src/app/dashboard) and worker mobile under [src/app/worker](src/app/worker)
- Components: reusable UI in [src/components](src/components) (dashboard, auth, shared, worker components).
- State & Utilities: [src/lib](src/lib) contains auth, firebase, firestore helpers, types, and utils.
  - See: [src/lib/auth-context.tsx](src/lib/auth-context.tsx)
  - See: [src/lib/firebase.ts](src/lib/firebase.ts)
  - See: [src/lib/firestore.ts](src/lib/firestore.ts)
- Backend / Serverless: repository includes `functions/` (Python) — minimal server-side logic likely for cloud functions or scripts. See [functions/main.py](functions/main.py).
- Data connectors: `dataconnect/` and generated bindings in [dataconnect-generated](dataconnect-generated) (GraphQL seed & schema available).
- Deployment / Ops: Dockerfile, docker-compose.yml, Firebase config files, and `apphosting.yaml` present for hosting/deployment.
  - See: [firebase.json](firebase.json), [firestore.rules](firestore.rules), [Dockerfile](Dockerfile), [docker-compose.yml](docker-compose.yml)

## Roles & Authorization
- Two primary roles: `employer` and `employee` (worker). Store role on user documents (e.g., `users/{uid}.role`).
- Authentication handled client-side with Firebase / auth context. Check `src/lib/auth-context.tsx`.
- Authorization rules must be enforced both client-side and via Firestore Security Rules.

## Key User Flows
- Sign up / Login: `signup` pages and `login` components under [src/components/auth](src/components/auth).
- Profile creation & edit: `profile` components and forms (dashboard and worker pages), persisted to `profiles` or `users` collection.
- Messaging: one-to-one messaging system (likely in `[messages]` folders under dashboard/worker). Messages should be stored in a `messages` collection (see Data Model below).
- Contracts: simple non-legal record of a hire between two users (employer signs/marks hiring of an employee). Implemented as `contracts` collection.
- Reviews & Badges: users can leave reviews and issue badges; both display on user profiles and aggregate rating displayed on profile pages.

## Recommended Data Model (Firestore collections)
Use normalized but simple collections. Adjust fields to match existing code where present.

- `users` (or `profiles`)
  - `uid`, `displayName`, `email`, `role` (`employer` | `employee`), `photoURL`, `tags`, `location`, `skills` (array), `createdAt`

- `messages`
  - `id`, `fromId`, `toId`, `text`, `attachments` (avoid heavy attachments), `createdAt`, `editedAt?`, `readAt?`, `status` (`sent`|`delivered`|`read`)
  - Index by conversation (composite) or create `conversations/{conversationId}/messages` for efficient queries.

- `conversations` (optional)
  - `id` (deterministic e.g., sorted uid pair), `participantIds`, `lastMessage`, `lastUpdated`

- `contracts`
  - `id`, `employerId`, `employeeId`, `jobId?`, `title`, `description?`, `startDate?`, `endDate?`, `status` (`active`|`completed`|`cancelled`), `createdAt`, `metadata`.
  - Document is a non-legal record: acts as a hiring marker only.

- `reviews`
  - `id`, `contractId?`, `reviewerId`, `subjectId` (user being reviewed), `rating` (1-5 int), `text`, `createdAt`

- `badges`
  - `id`, `name`, `description`, `iconUrl?`, `issuerId`, `recipientId`, `createdAt`

- `jobs`
  - `id`, `employerId`, `title`, `description`, `rate`, `location`, `status`

- `notifications` (optional push/UX notifications)

## Messaging Limitations & Recommendations
The repo mentions message flows with limitations. For future development, enforce these constraints (can be adjusted):
- Max message length: 2000 characters.
- Rate limit: 1 message per 5–10 seconds per sender to prevent spam (enforce server-side with Cloud Functions or Firestore security rules + backend validation).
- One-to-one only: disallow broadcast group messages unless explicitly added.
- Attachments: prefer links to externally hosted assets; avoid large files in Firestore.
- Message retention / deletion: consider TTL or soft-delete to manage storage.

## UI / UX Considerations
- Employer (Desktop): richer dashboard, multi-column lists, bulk actions, job management.
- Employee (Mobile): simplified navigation, bottom/tab nav (check `src/components/employee/employee-bottom-nav.tsx`), touch-friendly lists, progressive disclosure for job details.
- Responsiveness: Design mobile-first for worker flows, but ensure employer pages adapt to wide screens.
- Notifications & presence: use FCM for push notifications on mobile; presence (online/offline) via lightweight status docs.

## Badges & Reviews UX Rules
- Badge issuance: allow only certain actors to issue badges (e.g., employers or verified peers). Store issuerId and recipientId on badge docs.
- Reviews: require a contract or completed interaction to allow review (reduces abuse). Allow edits only for a short timeframe.
- Display: show aggregated rating on profile, with list of latest reviews and badges.

## Contracts (non-legal) UX & Data Rules
- Purpose: mark that an employee has been hired by an employer for a job/engagement.
- Minimal fields: `employerId`, `employeeId`, `title`, `createdAt`, `status`.
- Agreement/UI: show signatures/acknowledgements as checkboxes/timestamps rather than legal text.
- Visibility: both parties can see contract status on their dashboards.

## Security & Privacy
- Firestore rules: restrict writes so users can edit their own profile and only employers can create jobs. Reviews and badges should be write-limited to authenticated users and validated (e.g., require `contractId` for review).
  - See: [firestore.rules](firestore.rules)
- Sensitive files: `serviceAccountKey.json` should NOT be committed for production; use secrets managers in CI.
- PII handling: avoid storing extra sensitive data; follow privacy best practices.

## Observed Key Files & Locations
- App entry & pages: [src/app/page.tsx](src/app/page.tsx) and [src/app/layout.tsx](src/app/layout.tsx)
- Dashboard UI & pages: [src/app/dashboard](src/app/dashboard)
- Worker UI & pages: [src/app/worker](src/app/worker)
- Components library: [src/components](src/components)
  - Auth forms: [src/components/auth/login-form.tsx](src/components/auth/login-form.tsx) and [src/components/auth/signup-form.tsx](src/components/auth/signup-form.tsx)
  - Dashboard sidebar (current): [src/components/dashboard/dashboard-sidebar.tsx](src/components/dashboard/dashboard-sidebar.tsx)
- Utilities: [src/lib](src/lib)
- Server functions: [functions/main.py](functions/main.py)
- Dataconnect & seed data: [dataconnect/seed_data.gql](dataconnect/seed_data.gql), [dataconnect/schema/schema.gql](dataconnect/schema/schema.gql)
- Generated connectors: [dataconnect-generated](dataconnect-generated)

## Local Dev & Common Commands
- Install dependencies:

```bash
npm install
```

- Run dev server (Next.js):

```bash
npm run dev
```

- Lint / format (if configured): check `package.json` scripts. Use `npm run build` to validate production build.

- Running serverless functions locally: check `functions/` and its README, or run using relevant emulator (Firebase emulators) if configured.

## Environment & Secrets
Common environment variables expected (example names):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (server-side)

Do NOT commit service account credentials to public repos. Use `serviceAccountKey.json` only for local dev and keep it out of source control for production.

## Testing & Validation
- There are no explicit tests in the repo root. Add targeted unit tests for core utilities and integration tests for messaging and contract flows.
- Use Firebase Emulators to test security rules and background functions locally.

## Recommendations / Next Steps for Development
- Add explicit Firestore schema documentation and sample documents for `users`, `conversations`, `messages`, `contracts`, `reviews`, and `badges`.
- Implement server-side validation (Cloud Functions or callable endpoints) for rate-limiting messages and verifying review eligibility (must reference a contractId).
- Add automated e2e or integration tests for messaging, profile edits, and contract creation.
- Add push notifications (FCM) and offline sync for mobile worker flows.

## Where to Look First When You Need Context
- `src/lib/firebase.ts` and `src/lib/firestore.ts` — configuration and data helpers.
- `src/components/auth/*` — authentication flows.
- `src/app/dashboard` and `src/app/worker` — entry points for the two main surfaces.
- `functions/main.py` — any server-side or cloud function logic.

---

If you want, I can now:
- extract actual Firestore collection usage from code to refine the data model, or
- open/create a `SCHEMA.md` with example documents and rules snippets.

Which would you like next?