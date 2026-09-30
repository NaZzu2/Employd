# Employ'd — Consolidated Open Tasks

> Collects unimplemented / partially implemented work from [task.md](task.md) through [task_8.md](task_8.md). The authoritative MVP requirements and ship checklist are in [PRODUCT_PLAN.md](PRODUCT_PLAN.md).

`task.md`, `task_2.md`, and `task_6.md` are fully complete — no open items.

---

## From task_3.md — Employee Messaging & Finnish Job Listings

- [ ] `BadgeDisplay` — display employer badges on job cards
- [ ] `StarRatingDisplay` — show employer rating on job cards
- [ ] `UpgradePrompt` — optional upsell on limited actions (job board context)
- [ ] `JobDetailHeader` component — job title, employer, pay range
- [ ] `JobSearchFilters` component — search by title, skills, location
- [ ] Employer receives ping notification (if system implemented)

## From task_4.md — Employer Profiles & Real Job Posting

- [ ] Employer signup/onboarding: industry field as required dropdown (Construction, Manufacturing, Services, IT, Other) — currently free text
- [ ] Employer signup/onboarding: company logo/avatar image upload
- [ ] Ensure `users/{uid}` gets `role='employer'` created alongside `employerProfiles/{uid}` if not already present
- [ ] Employer profile page: button to upgrade subscription tier wired from this page specifically (upgrade page exists, confirm link present)
- [ ] Employer profile page: delete/deactivate account option (optional for MVP)
- [ ] Job detail (`/dashboard/my-jobs/[id]`): show number of views (view count wired in later task, confirm surfaced here)
- [ ] Job detail: show conversations related to this job
- [ ] "View Interested" action from My Jobs list (route exists — confirm linked from list, not just detail page)
- [ ] Employer dashboard "Recent Pings" widget: real-time `onSnapshot()` updates
- [ ] Employer dashboard: bell icon with unread ping count
- [ ] Employer Job Card: dedicated reusable component (title, type, location, status, posted date, ping count) — currently inline in my-jobs list
- [ ] Firestore rules: explicit verification pass for `employerProfiles`, `jobPosts` write rules (create/update/close), matching the checklist in Feature F1
- [ ] Geospatial filtering: pagination or virtual scroll for large job lists (optional for MVP)
- [ ] Debounced search input (300ms) on worker job board
- [ ] Handle Firestore connection/reconnection smoothly for real-time listeners
- [ ] Conversations persist after job closes — explicit verification
- [ ] No data loss on page refresh — explicit verification pass

## From task_5.md — Enhanced Job Management & Employer Features

- [ ] Sort "My Jobs" by "Most Conversations" (Most Recent / Most Pings / Status already present — confirm this sort option exists)
- [ ] Pagination on My Jobs list when > 10 jobs
- [ ] Job view tracking: display "👁️ N people have viewed this job" copy specifically on job detail page and employer job list (helpers exist — confirm UI text is present)
- [ ] Worker job card: "Save" button (add to saved jobs) — future feature, optional for MVP
- [ ] Worker job board: filter drawer/sidebar with job type checkboxes, pay-range slider, distance slider, skills-match toggle
- [ ] Worker job board: sort by "Best pay" / "Most relevant (skills match)"
- [ ] Worker job board: pagination or infinite scroll
- [ ] Enforce: employer without a profile is blocked (modal) from `/dashboard/post-job`, not just redirected
- [ ] Retry buttons for failed operations (create job, update job, ping) — confirm consistently present across all three flows
- [ ] Skeleton loaders specifically on Interested Workers page while fetching pings

## From task_7.md — Consolidation Leftovers

- [ ] Deprecate or redirect `src/app/dashboard/setup/page.tsx` to the unified profile page (currently still a separate route; sidebar still links to it)
- [ ] Pagination for My Jobs list wired into UI (cursor helpers exist in `firestore.ts`, not consumed by the page yet)
- [ ] Review Firestore rules pass for any remaining unauthorized-write gaps beyond conversation-creation restriction

## From task_8.md — Subscription Upgrade / Billing

- [ ] Unit tests for `getAvailablePlans` and `applySubscription` (mocked Firestore)
- [ ] Integration smoke test for the subscription chooser page

---

## Cross-Cutting Items (not tied to a single task file, but flagged during MVP review)

- [x] Employer-only chat initiation is enforced in the app and Firestore rules; employees can reply in an existing thread.
- [x] Chat is locked after contract acceptance without deleting its message history.
- [x] `.env.local.example` exists at the repository root.
- [x] One review per contract participant is enforced by deterministic Firestore review document IDs and create-only rules (see [PRODUCT_PLAN.md](PRODUCT_PLAN.md)).
- [ ] No automated tests exist anywhere in the repo (unit, integration, or Firestore rules tests).
- [ ] No CI pipeline exists.
