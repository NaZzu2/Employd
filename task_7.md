# Task 7 — Consolidation: Job Management, Employer Profile, and Remaining Tasks

## Goal
Finish and consolidate remaining employer/job-management work from Task 4–5 and fold relevant open items from earlier tasks. Produce a single `profile` page (create + edit), add missing job stats & view tracking, add an interested-workers route, improve close-job UX, and add small Firestore helpers and UI patterns to complete the flows.

---

## Prioritized Checklist (only unimplemented/partial items)

- [ ] Consolidate employer setup into a single profile page (create + edit)
  - Modify: `src/app/dashboard/profile/page.tsx` — support both create (when no employer profile) and edit flows (same UI, two modes). Add form validation and server save.
  - Update: `src/app/dashboard/post-job/page.tsx` — if employer profile missing, navigate to `src/app/dashboard/profile/page.tsx` or show a modal linking to it.
  - Optional cleanup: deprecate `src/app/dashboard/setup/page.tsx` or change it to redirect to the profile page.

- [ ] Add job view tracking & view-count helpers
  - Update: `src/lib/firestore.ts` — add:
    - `async function logJobView(jobId: string, workerId?: string): Promise<void>` — write a doc to `jobViews` (jobId, workerId?, viewedAt)
    - `async function getJobViewCount(jobId: string): Promise<number>` — count views with `where('jobId','==',jobId)`
  - Modify: `src/app/worker/jobs/[id]/page.tsx` — call `logJobView` when a worker opens job detail (debounce to avoid duplicate writes).
  - Modify: `src/app/dashboard/my-jobs/[id]/page.tsx` — display view count using `getJobViewCount`.

- [ ] Add `getJobConversationCount` helper & show conversation counts in My Jobs list
  - Update: `src/lib/firestore.ts` — add `async function getJobConversationCount(jobId: string): Promise<number>` that queries `conversations` where `jobPostId` equals the job id and returns count.
  - Update: `src/app/dashboard/my-jobs/page.tsx` and job-card components — fetch conversation counts (batch `Promise.all`) and display on each job card.

- [ ] Implement dedicated Interested Workers route
  - Create: `src/app/dashboard/my-jobs/[id]/interested/page.tsx` — list pings for the job with sorting (Most Recent, Highest Rated, Status) and actions: View Profile (link to worker profile view), Message (start/get conversation), Hire (stub linking to Task 6).
  - Modify: `src/app/dashboard/my-jobs/[id]/page.tsx` — add a clickable badge/button "View all interested (N)" linking to `/dashboard/my-jobs/${job.id}/interested`.

- [ ] Close Job: confirmation modal, spinner & redirect
  - Modify: replace instant toggle with a confirmation modal (text: "Close this job posting? It will no longer be visible to workers, but existing conversations remain active.") Buttons: Cancel / Confirm Close.
  - On confirm: call `updateJobPostStatus(jobId, 'closed')`, show spinner on confirm button, toast "Job closed successfully", then redirect to `/dashboard/my-jobs` and ensure job appears under Closed tab.
  - Code paths: `src/app/dashboard/my-jobs/[id]/page.tsx`, `src/app/dashboard/my-jobs/page.tsx` (job cards).

- [ ] Edit Job: lock job type & add missing fields + validation
  - Modify: `src/app/dashboard/my-jobs/[id]/edit/page.tsx` — expose and validate all fields (title, type (locked/read-only), location, salary, description, requirements). Add Cancel (route back to `/dashboard/my-jobs/[id]`) and success toast.

- [ ] Pagination for My Jobs list (>10)
  - Option A (quick): client-side pagination in `src/app/dashboard/my-jobs/page.tsx`.
  - Option B (scalable): implement Firestore cursor-based pagination in `src/lib/firestore.ts` and update UI to fetch pages.

- [ ] Add missing helper wrappers & small utilities
  - Update: `src/lib/firestore.ts` — add:
    - `getJobPingCount(jobId: string): Promise<number>`
    - `getJobConversationCount(jobId: string): Promise<number>` (as above)
  - Use these helpers in `src/app/dashboard/my-jobs/page.tsx` for clarity.

- [ ] Improve error messages and retry options
  - Modify critical flows to add retry buttons where appropriate (create job, update job, ping) and surface Firestore error codes/messages.
  - Files to update: `src/app/dashboard/post-job/page.tsx`, `src/app/dashboard/my-jobs/[id]/edit/page.tsx`, `src/app/worker/jobs/[id]/page.tsx`.

- [ ] Add skeleton/loading for Interested Workers page
  - Show skeleton while fetching pings in `src/app/dashboard/my-jobs/[id]/interested/page.tsx`.

- [ ] Add worker profile view (Employer-side) and link from pings/conversations
  - Create: `src/components/dashboard/worker-profile-readonly.tsx` or `src/app/dashboard/worker/[id]/page.tsx` — read-only component for employer viewing of worker profile (name, avatar, title, skills, rating, reviews).
  - Link from: `src/app/dashboard/my-jobs/[id]/page.tsx` and `src/app/dashboard/my-jobs/[id]/interested/page.tsx`.

- [ ] Fold remaining smaller tasks from Task 2/3/4
  - Review Firestore rules and add missing security constraints to prevent unauthorized writes (if not already present).
  - Consider adding aggregated counters or Firestore indexes for `jobViews` and conversation counting for performance.

---

## Files to Create / Modify (exact paths)

- Modify: `src/app/dashboard/profile/page.tsx` — merge create/edit modes (replace or augment existing setup page)
- Modify: `src/app/dashboard/post-job/page.tsx` — check profile and route to `profile` page if missing
- Optional: `src/app/dashboard/setup/page.tsx` — redirector to `profile` or remove after migration
- Modify: `src/lib/firestore.ts` — add helpers: `logJobView`, `getJobViewCount`, `getJobConversationCount`, `getJobPingCount`
- Modify: `src/app/worker/jobs/[id]/page.tsx` — call `logJobView` on mount
- Modify: `src/app/dashboard/my-jobs/page.tsx` — add conversation counts, close-job modal, pagination
- Create: `src/app/dashboard/my-jobs/[id]/interested/page.tsx` — dedicated interested-workers view
- Modify: `src/app/dashboard/my-jobs/[id]/page.tsx` — add link to interested page and show view count
- Modify: `src/app/dashboard/my-jobs/[id]/edit/page.tsx` — lock `jobType` input, add validation, cancel behavior
- Create/Modify: `src/components/dashboard/worker-profile-readonly.tsx` — employer view of worker profile
- Modify: Firestore rules file(s) (if present in repo) — add/enforce security improvements

---

## Helper functions to add (names & file)

- `src/lib/firestore.ts`
  - `export async function logJobView(jobId: string, workerId?: string): Promise<void>`
  - `export async function getJobViewCount(jobId: string): Promise<number>`
  - `export async function getJobConversationCount(jobId: string): Promise<number>`
  - `export async function getJobPingCount(jobId: string): Promise<number>`

Implementation notes:
- For `logJobView`, write docs to `jobViews` with minimal fields: `{ jobId, workerId?, viewedAt }`.
- Debounce view logging with session-localStorage per-job key to avoid duplicate writes during a session.
- For counts, prefer server-side aggregation/Cloud Functions for scale in production; use client-side counting for MVP.

---

## Quick Developer Tasks (short step sequence)

1. Add `getJobConversationCount` and `logJobView` to `src/lib/firestore.ts`.
2. Update worker job detail page to call `logJobView` on mount.
3. Display `getJobViewCount(jobId)` on job detail and in My Jobs list.
4. Create `/dashboard/my-jobs/[id]/interested` page at `src/app/dashboard/my-jobs/[id]/interested/page.tsx`.
5. Replace immediate redirect in `src/app/dashboard/setup/page.tsx` with routing to `src/app/dashboard/profile/page.tsx` and alter profile page to support creation.
6. Add close confirmation modal and spinner in `src/app/dashboard/my-jobs/[id]/page.tsx` and `src/app/dashboard/my-jobs/page.tsx`.
7. Lock job type in `src/app/dashboard/my-jobs/[id]/edit/page.tsx` and add required-field validations.
8. Add pagination UI in `src/app/dashboard/my-jobs/page.tsx` (or paginate server-side).

---

Task 7 created.
