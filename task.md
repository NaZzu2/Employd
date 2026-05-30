# Employ'd — Build Task Tracker

## Phase 1: Foundation & Types
- [x] Read & analyze existing codebase
- [x] Create implementation plan
- [x] `src/lib/types.ts` — extended types
- [x] `src/lib/badge-config.ts` — badge definitions
- [x] `src/lib/firebase.ts` — Firebase init
- [x] `src/lib/firestore.ts` — Firestore helpers
- [x] `src/lib/auth-context.tsx` — React Auth context
- [x] `src/lib/utils.ts` — Haversine geo utility
- [x] `.env.local.example` — Firebase config template

## Phase 2: Auth Flow
- [x] `src/components/auth/login-form.tsx` — Firebase email/password login
- [x] `src/components/auth/signup-form.tsx` — Role selection + Firebase signup
- [x] `src/app/page.tsx` — Wire Firebase login, role-based redirect
- [x] `src/app/signup/page.tsx` — Role-aware signup page
- [x] `src/app/layout.tsx` — Wrap with AuthProvider

## Phase 3: Employer Dashboard
- [x] `src/components/dashboard/dashboard-sidebar.tsx` — Updated nav
- [x] `src/app/dashboard/page.tsx` — Worker profile board (employer view)
- [x] `src/components/dashboard/worker-card.tsx` — Worker profile card
- [x] `src/app/dashboard/my-jobs/page.tsx` — Employer's job posts
- [x] `src/components/dashboard/job-post-form.tsx` — Job posting form
- [x] `src/app/dashboard/messages/page.tsx` — Conversation list
- [x] `src/app/dashboard/messages/[conversationId]/page.tsx` — Chat view
- [x] `src/app/dashboard/pings/page.tsx` — Worker pings inbox
- [x] `src/app/dashboard/reviews/page.tsx` — Review management
- [x] `src/app/dashboard/profile/page.tsx` — Updated employer profile

## Phase 4: Worker Mobile App
- [x] `src/app/worker/layout.tsx` — Mobile bottom-nav layout
- [x] `src/components/worker/worker-bottom-nav.tsx` — Bottom tab bar
- [x] `src/app/worker/page.tsx` — Job feed
- [x] `src/components/worker/job-feed-card.tsx` — Mobile job card
- [x] `src/components/worker/ping-dialog.tsx` — Ping a job sheet
- [x] `src/app/worker/my-profile/page.tsx` — Worker profile page
- [x] `src/components/worker/worker-profile-form.tsx` — Profile edit form
- [x] `src/app/worker/messages/page.tsx` — Conversation list
- [x] `src/app/worker/messages/[conversationId]/page.tsx` — Chat view
- [x] `src/app/worker/reviews/page.tsx` — Reviews & hire acceptance

## Phase 5: Shared Components
- [x] `src/components/shared/star-rating.tsx`
- [x] `src/components/shared/badge-display.tsx`
- [x] `src/components/shared/review-form.tsx`
- [x] `src/components/shared/message-thread.tsx`

## Phase 6: Firebase Setup Guide
- [x] Firebase setup instructions documented
- [x] Firestore security rules file

## Phase 7: Docker & Local Dev
- [x] `Dockerfile` — Multi-stage production build with build-arg support
- [x] `docker-compose.yml` — One-command local dev
- [x] `public/` directory — Required by Dockerfile COPY step
- [x] `.dockerignore` — Optimized build context
- [x] Cross-platform build script fix
- [x] `force-dynamic` on dashboard/worker layouts — fix prerender crash during Docker build
