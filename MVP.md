# Employ'd — MVP Task List

> Scope reference for the minimum viable product. Companion to [CONTEXT.md](CONTEXT.md), [PLAN.md](PLAN.md), and the existing [MVP_PLAN.md](MVP_PLAN.md). This file is the authoritative MVP checklist reflecting the latest product requirements. Where it conflicts with older docs (e.g. chat-initiation direction), **this file wins**.

## MVP Goal
A working product usable today by a real employer (desktop browser) and a real employee (mobile phone browser):
1. Sign up / log in with a role (employer or employee).
2. Create and edit a profile (company profile for employer, worker profile for employee).
3. Employer posts jobs; employee browses/searches jobs.
4. **Employers can initiate chat** with an employee; employee replies once a thread exists.
5. Employer marks an employee as hired via a non-legal "contract" record; employee accepts/declines.
6. **Once both parties have agreed a contract, the chat for that pair is disabled (read-only, not deleted).**
7. After a contract is accepted, either party can leave a star review and award a badge, visible on the other's profile.
8. Employer experience is optimized for desktop/browser; employee experience is optimized for mobile phone.

---

## ⚠️ Key Requirement Gaps vs. Current Code (must resolve first)

- **Chat initiation direction is correct as-is.** Existing code (`startConversation` in [src/lib/firestore.ts](src/lib/firestore.ts) and `firestore.rules`) only allows **employers** to start a conversation; workers are locked out of sending the first message until the employer has sent one. This matches the MVP requirement — no change needed here.
- **No mechanism disables chat after a contract is agreed.** Contracts (`contracts` collection) and conversations (`conversations` collection) are currently unlinked at the disable-on-accept level — a contract can go `active`/`completed` but the associated conversation stays fully open. Needs new logic (see Task List below).

---

## Verified Current State (already implemented, confirmed by code inspection)

- ✅ Firebase email/password auth with role stored on `users/{uid}.role` ([src/lib/auth-context.tsx](src/lib/auth-context.tsx)).
- ✅ Role-based routing: `/dashboard/*` (employer, desktop sidebar) vs `/worker/*` (employee, mobile bottom-nav).
- ✅ Employer profile create/edit consolidated on [src/app/dashboard/profile/page.tsx](src/app/dashboard/profile/page.tsx) (handles both create and edit modes).
- ✅ Worker profile create/edit at [src/app/worker/my-profile/page.tsx](src/app/worker/my-profile/page.tsx).
- ✅ Job posting, editing, closing, and real-time worker job board with geospatial + skill filters.
- ✅ Pings (worker expresses interest) with duplicate-prevention.
- ✅ Messaging: real-time `onSnapshot`, read receipts (`seenAt`), timestamps, per-tier thread limits, message length cap (2000 chars) + rate limiting (5s), all enforced in both `firestore.ts` and `firestore.rules`.
- ✅ Contracts: `contracts` collection, employer creates → worker accepts/declines → employer marks complete. Pages exist at [src/app/dashboard/contracts/page.tsx](src/app/dashboard/contracts/page.tsx) and [src/app/worker/contracts/page.tsx](src/app/worker/contracts/page.tsx). Explicitly non-legal (no e-sign).
- ✅ Reviews & badges: `reviews` collection tied to `contractId`, 5 badge types, badge-limit-per-tier (client-side), aggregate rating mirrored to `users/{uid}` and role profile doc.
- ✅ Worker pool browser for employers ("Find Workers") with skill/radius/looking-for-work filters.
- ✅ Job view tracking, ping counts, conversation counts, "Interested Workers" route, close-job confirmation modal, employer-side read-only worker profile view — all implemented (task_5/task_7 leftovers, confirmed present in [src/app/dashboard/my-jobs/[id]/interested/page.tsx](src/app/dashboard/my-jobs/%5Bid%5D/interested/page.tsx) and [src/components/dashboard/worker-profile-readonly.tsx](src/components/dashboard/worker-profile-readonly.tsx)).
- ✅ Subscription/billing UI stub (mock flow) at [src/app/dashboard/subscriptions/page.tsx](src/app/dashboard/subscriptions/page.tsx) — good enough for MVP (real Stripe integration is out of scope).

---

## MVP Task List (what's left to reach MVP)

### 1. Chat: Confirm employer-initiated direction stays intact
- [x] `startConversation` in [src/lib/firestore.ts](src/lib/firestore.ts) requires `role === 'employer'` — correct, no change needed.
- [x] `firestore.rules` `conversations` `allow create` requires `employerId == request.auth.uid` — correct, no change needed.
- [x] Worker is locked out of sending the first message until the employer has sent one ([src/components/shared/message-thread.tsx](src/components/shared/message-thread.tsx)) — correct, no change needed.

### 2. Chat: Disable after contract accepted (both parties agreed) — ✅ Implemented
- [x] Added `contractId?` and `locked?: boolean` fields to the `Conversation` type in [src/lib/types.ts](src/lib/types.ts).
- [x] `workerRespondToContract(id, true)` now calls `lockConversationForContract` in [src/lib/firestore.ts](src/lib/firestore.ts), which finds the conversation between the same employer/worker pair and sets `locked: true` on it.
- [x] `firestore.rules` `messages` `allow create` now checks `.data.get('locked', false) != true`.
- [x] `MessageThread` renders a read-only banner ("This conversation is locked — the contract has been agreed by both parties.") and hides the input for both parties when `locked === true`.
- [x] Employer and worker conversation list items show a "Locked" badge for locked threads.

### 3. Profiles — verify full create/edit parity — ✅ Verified/fixed
- [x] Confirmed `role='employer'`/`role='worker'` is already persisted on `users/{uid}` at signup time in [src/lib/auth-context.tsx](src/lib/auth-context.tsx) `signUp` — no gap, task_4 note was stale.
- [x] Industry field on [src/app/dashboard/profile/page.tsx](src/app/dashboard/profile/page.tsx) converted to a constrained dropdown (Construction, Manufacturing, Services, IT, Other).
- [x] Worker profile edit form ([src/components/worker/worker-profile-form.tsx](src/components/worker/worker-profile-form.tsx)) confirmed to cover title, location, summary, skills, and looking-for-work toggle. Avatar upload is not implemented (falls back to initials avatar everywhere) — acceptable gap for MVP, not blocking.

### 4. Review & badge system — confirm contract-gating end-to-end — ✅ Implemented
- [x] Both [src/app/dashboard/reviews/page.tsx](src/app/dashboard/reviews/page.tsx) and [src/app/worker/reviews/page.tsx](src/app/worker/reviews/page.tsx) rewritten to use real Firestore data: live contracts via `subscribeToUserContracts`, real reviews via `getReviewsForUser`, real rating/badge totals from `userDoc`. Mock arrays removed.
- [x] "Leave Review" is only offered for contracts with status `active` or `completed` (i.e. once accepted by both parties), matching the MVP requirement that reviews unlock right after contract acceptance, not only after completion.
- [x] One review per contract per reviewer enforced in the UI via `hasReviewedContract` — once reviewed, the button is replaced with a "Reviewed" badge.

### 5. Mobile verification (employee = phone, browser = employer)
- [x] Code-level review: [src/app/worker/layout.tsx](src/app/worker/layout.tsx) constrains to phone width (`max-w-lg`) with a sticky bottom nav (`h-16`, well above the 40px tap-target minimum); [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx) uses the full-width sidebar layout with no mobile constraint.
- [ ] **Still requires a human pass on a real phone browser** (this environment has no device/browser access) — signup, profile edit, job browse, ping, start chat, accept contract, review. Confirm no horizontal scroll and comfortable tap targets in practice, not just in code.

### 6. Environment & local runnability
- [x] `.env.local.example` exists at repo root with the exact Firebase env var names read by [src/lib/firebase.ts](src/lib/firebase.ts), plus optional Stripe/billing vars.
- [ ] `npm run dev` / `npm run build` / `npm run typecheck` / `npm run lint` — **could not be run in this environment** (Node.js/npm is not installed/available here). All edited files were verified error-free via the editor's TypeScript language service (`get_errors`), but a real `npm run build` should still be run before shipping.

### 7. End-to-end walkthrough (Definition of Done for MVP)
> **Not executable in this environment** — no Node.js/npm, no browser, no device access here. All steps below are implemented in code and verified error-free by the language service, but require a human to actually run `npm run dev` and click through them against a real Firebase project.
- [ ] Employer signs up (browser) → completes company profile.
- [ ] Employer posts a job.
- [ ] Employee signs up (phone) → completes worker profile.
- [ ] Employee finds the job and pings it.
- [ ] Employer views the ping and **starts a chat** with the employee.
- [ ] Employee replies in the now-existing thread.
- [ ] Employer creates a contract for the employee.
- [ ] Employee accepts the contract → **chat becomes locked/read-only for that pair**.
- [ ] Employer marks the contract complete.
- [ ] Both parties leave a review + badge for each other; both profiles show updated rating/badge counts.
- [ ] All of the above completes with no unhandled errors on both a desktop browser and a real mobile phone browser.

---

## Explicitly Out of Scope for MVP
- Real Stripe billing integration (mock flow is sufficient).
- PWA installability / offline support / service worker.
- Server-side (Firestore rules) badge-limit enforcement (client-side check is sufficient for MVP).
- CI pipeline, automated test suite.
- AI recommendation flows under [src/ai](src/ai).
- Job view analytics beyond the basic counter already implemented.
