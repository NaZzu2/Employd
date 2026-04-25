# Employ'd — Full Platform Architecture & Boilerplate Plan

## Overview

The existing codebase is a **Next.js 15 + Tailwind + shadcn/ui** app with a single "employee view" — a dashboard showing job listings, a profile page, and basic auth screens. There is no real authentication, no role separation, no database, and no backend logic yet.

The goal is to design a **two-sided marketplace**:
- **Employers** — desktop-focused, post jobs, browse worker profiles, start conversations, give reviews + badges
- **Employees** — mobile-first, post short profiles, browse job listings, ping employers about jobs, give reviews + badges

This plan covers the full high-level architecture and the boilerplate files to be created/modified.

---

## User Review Required

> [!IMPORTANT]
> **Auth Strategy**: The current app has no real auth. Since Firebase is already a dependency (`firebase` in package.json), the plan uses **Firebase Authentication** (Email/Password + optional Google OAuth). The user's role (`employer` | `employee`) is stored on the user's Firestore document at signup. Please confirm this is acceptable, or specify an alternative (e.g. NextAuth, Clerk, Supabase).

> [!IMPORTANT]
> **Database**: The plan uses **Firestore** (already in the Firebase dependency) as the backend. All jobs, profiles, messages, reviews, and badges will be stored in Firestore collections. Confirm if this is the intended database or if you prefer another (Postgres via Supabase, PlanetScale, etc.).

> [!WARNING]
> **Mobile-First for Employees**: The employee view will be a completely separate layout (`/worker/*` routes) from the employer dashboard (`/dashboard/*`). The employer dashboard keeps its current sidebar + desktop layout. The worker view uses a bottom-tab-bar mobile layout. After role detection on login, users are redirected to the correct root.

> [!NOTE]
> **Subscription Levels**: Architecture will include a `subscriptionTier: 'free' | 'pro' | 'enterprise'` field on user documents and a `hasFeature()` utility — but no paywall UI will be built in this phase. This makes it easy to slot in Stripe later.

---

## Architecture Overview

### Role Routing

```
/ (login) → detects role → 
  employer  → /dashboard/*   (desktop sidebar layout, currently exists)
  employee  → /worker/*      (mobile bottom-tab layout, NEW)
```

### Data Model (Firestore Collections)

| Collection | Key Fields |
|---|---|
| `users/{uid}` | `role`, `displayName`, `email`, `avatarUrl`, `subscriptionTier`, `createdAt` |
| `employerProfiles/{uid}` | `companyName`, `industry`, `location`, `description`, `website` |
| `workerProfiles/{uid}` | `title`, `location`, `summary`, `skills[]`, `experience[]`, `education[]` |
| `jobPosts/{id}` | `employerId`, `title`, `company`, `location`, `type`, `salary`, `description`, `requirements[]`, `status`, `createdAt` |
| `conversations/{id}` | `employerId`, `workerId`, `jobPostId?`, `createdAt`, `lastMessageAt` |
| `messages/{convId}/messages/{id}` | `senderId`, `senderRole`, `text`, `createdAt` |
| `pings/{id}` | `workerId`, `jobPostId`, `employerId`, `message`, `status`, `createdAt` |
| `reviews/{id}` | `fromUid`, `toUid`, `fromRole`, `stars` (1-5), `badges[]`, `contractRef?`, `createdAt` |
| `contracts/{id}` | `employerId`, `workerId`, `jobPostId`, `status` (`active`\|`completed`), `createdAt` |

### Badge System

5 badges, each awarded **once per review** (giver can choose any 1 badge per review):

| Badge | Icon | Description |
|---|---|---|
| ⚡ `punctual` | Zap | Always on time |
| 🛡️ `reliable` | Shield | Delivered as promised |
| 💎 `quality` | Gem | Exceptional quality of work |
| 🤝 `professional` | Handshake | Outstanding professionalism |
| 🚀 `goes_above` | Rocket | Goes above and beyond |

Each badge is stored as an array field on each `users/{uid}` document: `badges: { type: BadgeType, count: number }[]` — aggregated from reviews.

### Messaging Rules

- **Employers** can open a new `conversation` (start a thread) with any worker they have seen
- **Workers** can only send a **ping** (a lightweight interest signal) on a job post — cannot initiate a full conversation
- Once an employer starts a conversation, both parties can send messages freely
- Employer pings inbox shows all pings for their job posts; they can convert a ping into a conversation

### Review Rules

- Reviews can only be given when a `contract` between the two parties exists with `status: 'completed'`
- Each party can only give **one review** per contract
- Each review includes a star rating (1-5) and exactly **one badge** (chosen from the 5)
- Badge counts on the user's profile aggregate from all reviews received

---

## Proposed Changes

### Phase 1 — Foundation & Auth

#### [MODIFY] [types.ts](file:///e:/Repos/Employ'd/src/lib/types.ts)
Extend with all new types: `UserRole`, `EmployerProfile`, `WorkerProfile`, `JobPost`, `Message`, `Conversation`, `Ping`, `Review`, `Contract`, `BadgeType`, `SubscriptionTier`.

#### [NEW] `src/lib/firebase.ts`
Firebase app initialization, Firestore & Auth exports.

#### [NEW] `src/lib/auth-context.tsx`
React context providing `currentUser`, `userRole`, `userProfile` — wraps Firebase `onAuthStateChanged`.

#### [MODIFY] [layout.tsx](file:///e:/Repos/Employ'd/src/app/layout.tsx)
Wrap app in `AuthProvider`.

#### [MODIFY] [page.tsx](file:///e:/Repos/Employ'd/src/app/page.tsx) (login)
Wire up Firebase email/password auth. On login success, read user's `role` from Firestore and redirect to `/dashboard` (employer) or `/worker` (employee).

#### [MODIFY] [signup/page.tsx](file:///e:/Repos/Employ'd/src/app/signup/page.tsx)
Add role selection step (Employer / Employee toggle) to the signup flow. Create Firestore user document on signup.

---

### Phase 2 — Employer Dashboard (extends existing)

The existing `/dashboard/*` layout is kept and improved.

#### [MODIFY] [dashboard-sidebar.tsx](file:///e:/Repos/Employ'd/src/components/dashboard/dashboard-sidebar.tsx)
Update nav items:
- **Board** (browse worker profiles — employees' posts)
- **My Jobs** (employer's own job posts)
- **Messages** (conversation list)
- **Pings** (worker interest signals on their jobs)
- **Reviews** (received reviews + give reviews)
- **Profile** (employer company profile)

#### [MODIFY] `/dashboard/page.tsx`
Change from job listings to **worker profile browsing** (the board employers see). Grid of `WorkerCard` components.

#### [NEW] `src/components/dashboard/worker-card.tsx`
Card showing a worker's avatar, title, location, top skills, and a "Start Conversation" button.

#### [NEW] `/dashboard/my-jobs/page.tsx`
Employer's own job posts. Lists their `JobPost` documents. Has a "+ Post New Job" button.

#### [NEW] `src/components/dashboard/job-post-form.tsx`
Form (react-hook-form + zod) for creating/editing a job posting: title, company, location, type, salary, description, requirements.

#### [NEW] `/dashboard/messages/page.tsx`
List of conversations the employer has started. Click opens the chat view.

#### [NEW] `/dashboard/messages/[conversationId]/page.tsx`
Full chat UI — message thread with send box.

#### [NEW] `/dashboard/pings/page.tsx`
List of worker pings received on the employer's job posts. Shows worker profile snippet + their message. Button to "Reply" (creates conversation).

#### [NEW] `/dashboard/reviews/page.tsx`
Shows reviews received + lists completed contracts where employer hasn't given a review yet (with a "Leave Review" button).

#### [NEW] `src/components/dashboard/review-form.tsx`
Star rating (1-5) + badge picker (choose 1 of 5) + optional text comment.

---

### Phase 3 — Worker App (Mobile-First, NEW Layout)

#### [NEW] `src/app/worker/layout.tsx`
Mobile-first layout with a **bottom navigation bar** (Home, Jobs, Messages, Profile). No sidebar. Max-width constrained, centered, phone-frame-ish on desktop.

#### [NEW] `src/components/worker/worker-bottom-nav.tsx`
Bottom tab bar with icons: Home (board), Jobs (job listings), Messages (conversations), Profile.

#### [NEW] `/worker/page.tsx` — **Worker Home / Board**
The worker's "feed" — a vertical scrollable list of employer job posts (similar to a card feed). Each card shows job title, company, location, salary, and a **"Ping"** button.

#### [NEW] `src/components/worker/job-feed-card.tsx`
Mobile-optimized job listing card with swipe-friendly layout.

#### [NEW] `/worker/my-profile/page.tsx`
Worker's own short profile — reuses existing profile design but in the mobile layout. Has "Edit Profile" button.

#### [NEW] `src/components/worker/worker-profile-form.tsx`
Form for creating/editing worker profile: title, location, summary, skills (tag input), experience, education.

#### [NEW] `/worker/messages/page.tsx`
List of conversations the worker is part of (can only appear after employer initiates).

#### [NEW] `/worker/messages/[conversationId]/page.tsx`
Chat thread view (shared component with employer messages, different layout).

#### [NEW] `/worker/reviews/page.tsx`
Received reviews + badge showcase. Completed contracts where worker hasn't reviewed yet.

#### [NEW] `src/components/worker/ping-dialog.tsx`
Small sheet/modal for a worker to write a short message when pinging a job.

---

### Phase 4 — Shared Components & Utilities

#### [NEW] `src/components/shared/review-form.tsx`
Reusable review form with star picker + badge picker (used by both employer and worker review pages).

#### [NEW] `src/components/shared/badge-display.tsx`
Shows a user's earned badges with counts and icons.

#### [NEW] `src/components/shared/star-rating.tsx`
Interactive 1-5 star rating input and read-only display variant.

#### [NEW] `src/components/shared/message-thread.tsx`
Reusable chat thread component used in both employer and worker message pages.

#### [NEW] `src/lib/firestore.ts`
Typed Firestore helpers: `createJobPost`, `getWorkerProfiles`, `sendMessage`, `createPing`, `createReview`, `markContractComplete`, etc.

#### [NEW] `src/lib/badge-config.ts`
Badge definitions: type enum, display names, icons, descriptions.

---

## File Structure After Boilerplate

```
src/
├── app/
│   ├── page.tsx                          [MODIFY] — real Firebase auth
│   ├── signup/page.tsx                   [MODIFY] — role selection
│   ├── dashboard/                        [MODIFY existing employer routes]
│   │   ├── layout.tsx
│   │   ├── page.tsx                      ← browse worker profiles
│   │   ├── my-jobs/page.tsx              [NEW]
│   │   ├── messages/
│   │   │   ├── page.tsx                  [NEW]
│   │   │   └── [conversationId]/page.tsx [NEW]
│   │   ├── pings/page.tsx                [NEW]
│   │   ├── reviews/page.tsx              [NEW]
│   │   ├── profile/page.tsx              [MODIFY]
│   │   └── jobs/[id]/page.tsx            [existing]
│   └── worker/                           [NEW — mobile layout]
│       ├── layout.tsx
│       ├── page.tsx                      ← job feed
│       ├── my-profile/page.tsx
│       ├── messages/
│       │   ├── page.tsx
│       │   └── [conversationId]/page.tsx
│       └── reviews/page.tsx
├── components/
│   ├── auth/                             [MODIFY]
│   ├── dashboard/                        [MODIFY + add]
│   │   ├── worker-card.tsx               [NEW]
│   │   ├── job-post-form.tsx             [NEW]
│   │   └── review-form.tsx              [NEW]
│   ├── worker/                           [NEW]
│   │   ├── worker-bottom-nav.tsx
│   │   ├── job-feed-card.tsx
│   │   ├── worker-profile-form.tsx
│   │   └── ping-dialog.tsx
│   └── shared/                           [NEW]
│       ├── star-rating.tsx
│       ├── badge-display.tsx
│       ├── review-form.tsx
│       └── message-thread.tsx
└── lib/
    ├── types.ts                          [MODIFY]
    ├── firebase.ts                       [NEW]
    ├── auth-context.tsx                  [NEW]
    ├── firestore.ts                      [NEW]
    └── badge-config.ts                   [NEW]
```

---

## Open Questions

> [!IMPORTANT]
> **Firebase Project**: Do you have a Firebase project set up with Firestore and Authentication enabled? If yes, please share the config values (or confirm they're in the `.env` file). The current `.env` only has one variable.

> [!IMPORTANT]
> **Badge Selection During Review**: Should the reviewer pick exactly 1 badge (required), make it optional, or be able to pick multiple? The proposal is **exactly 1 required badge** per review to keep badges meaningful and scarce.

> [!NOTE]
> **Contract Creation**: How does a contract get created? Options: (a) employer manually marks "hired" on a worker's profile, (b) employer sends a formal "offer" that the worker accepts, or (c) it's an admin-created record outside the app for now. The simplest boilerplate approach is (a) — employer clicks "Mark as Hired" on a worker, which creates a contract.

> [!NOTE]
> **Worker Profile Board Visibility**: Should workers need to explicitly "publish" their profile to appear on the employer board, or is every registered worker automatically visible?

---

## Verification Plan

### Automated
- `npm run typecheck` — after each phase to catch type errors
- `npm run lint` — code quality checks

### Manual (Browser)
1. Sign up as Employer → redirected to `/dashboard` with employer-role nav
2. Sign up as Employee → redirected to `/worker` with mobile bottom nav
3. Employer posts a job → appears in worker job feed
4. Worker pings a job → appears in employer pings inbox
5. Employer starts conversation → both parties can message
6. Employer marks contract complete → both can leave a review with 1 badge
7. Badges accumulate on user profile

