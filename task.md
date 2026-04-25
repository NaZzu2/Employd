# Employ'd — Build Task Tracker

## Phase 1: Foundation & Types
- [x] Read & analyze existing codebase
- [x] Create implementation plan
- [ ] `src/lib/types.ts` — extended types
- [ ] `src/lib/badge-config.ts` — badge definitions
- [ ] `src/lib/firebase.ts` — Firebase init
- [ ] `src/lib/firestore.ts` — Firestore helpers
- [ ] `src/lib/auth-context.tsx` — React Auth context
- [ ] `src/lib/utils.ts` — Haversine geo utility
- [ ] `.env.local.example` — Firebase config template

## Phase 2: Auth Flow
- [ ] `src/components/auth/login-form.tsx` — Firebase email/password login
- [ ] `src/components/auth/signup-form.tsx` — Role selection + Firebase signup
- [ ] `src/app/page.tsx` — Wire Firebase login, role-based redirect
- [ ] `src/app/signup/page.tsx` — Role-aware signup page
- [ ] `src/app/layout.tsx` — Wrap with AuthProvider

## Phase 3: Employer Dashboard
- [ ] `src/components/dashboard/dashboard-sidebar.tsx` — Updated nav
- [ ] `src/app/dashboard/page.tsx` — Worker profile board (employer view)
- [ ] `src/components/dashboard/worker-card.tsx` — Worker profile card
- [ ] `src/app/dashboard/my-jobs/page.tsx` — Employer's job posts
- [ ] `src/components/dashboard/job-post-form.tsx` — Job posting form
- [ ] `src/app/dashboard/messages/page.tsx` — Conversation list
- [ ] `src/app/dashboard/messages/[conversationId]/page.tsx` — Chat view
- [ ] `src/app/dashboard/pings/page.tsx` — Worker pings inbox
- [ ] `src/app/dashboard/reviews/page.tsx` — Review management
- [ ] `src/app/dashboard/profile/page.tsx` — Updated employer profile

## Phase 4: Worker Mobile App
- [ ] `src/app/worker/layout.tsx` — Mobile bottom-nav layout
- [ ] `src/components/worker/worker-bottom-nav.tsx` — Bottom tab bar
- [ ] `src/app/worker/page.tsx` — Job feed
- [ ] `src/components/worker/job-feed-card.tsx` — Mobile job card
- [ ] `src/components/worker/ping-dialog.tsx` — Ping a job sheet
- [ ] `src/app/worker/my-profile/page.tsx` — Worker profile page
- [ ] `src/components/worker/worker-profile-form.tsx` — Profile edit form
- [ ] `src/app/worker/messages/page.tsx` — Conversation list
- [ ] `src/app/worker/messages/[conversationId]/page.tsx` — Chat view
- [ ] `src/app/worker/reviews/page.tsx` — Reviews & hire acceptance

## Phase 5: Shared Components
- [ ] `src/components/shared/star-rating.tsx`
- [ ] `src/components/shared/badge-display.tsx`
- [ ] `src/components/shared/review-form.tsx`
- [ ] `src/components/shared/message-thread.tsx`

## Phase 6: Firebase Setup Guide
- [ ] Firebase setup instructions documented
- [ ] Firestore security rules file
