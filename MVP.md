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

### 2. Chat: Disable after contract accepted (both parties agreed)
- [ ] Add a `contractId?` and `locked?: boolean` field to the `Conversation` type in [src/lib/types.ts](src/lib/types.ts).
- [ ] When a worker accepts a contract (`workerRespondToContract(id, true)`), find the conversation between the same employer/worker pair (and job, if applicable) and set `locked: true` on it.
- [ ] Update `firestore.rules` `messages` `allow create` to also check `get(conversation).data.locked != true`.
- [ ] Update `MessageThread` to render a read-only banner ("This conversation is locked — contract has been agreed") and hide/disable the input when `locked === true`. Existing messages remain visible (not deleted).
- [ ] Update employer and worker conversation list items to show a "Locked" badge/icon for locked threads.

### 3. Profiles — verify full create/edit parity
- [ ] Confirm employer profile form persists `role='employer'` on `users/{uid}` at signup time (currently only in `employerProfiles/{uid}`, per task_4 A1 gap) — add if missing.
- [ ] Confirm industry field is a constrained input (dropdown: Construction, Manufacturing, Services, IT, Other) rather than free text, per original spec (currently a free-text `Input`).
- [ ] Verify worker profile edit form covers all fields workers need to be discoverable (skills, location, looking-for-work toggle, avatar).

### 4. Review & badge system — confirm contract-gating end-to-end
- [ ] Verify UI only allows submitting a review when a `contract` between the two parties exists and is `active` or `completed` (not before) — audit [src/app/dashboard/reviews/page.tsx](src/app/dashboard/reviews/page.tsx) and [src/app/worker/reviews/page.tsx](src/app/worker/reviews/page.tsx), which currently mix in mock data; replace mock arrays with real Firestore-backed contract/review fetches.
- [ ] Confirm one review per contract per reviewer is enforced (`getReviewForContract`-style check before allowing submission).

### 5. Mobile verification (employee = phone, browser = employer)
- [ ] Manual pass on a real phone browser: signup, profile edit, job browse, ping, start chat, accept contract, review — confirm no layout breakage, tap targets ≥40px, no horizontal scroll.
- [ ] Confirm `/dashboard/*` remains usable as a normal desktop browser page (no forced mobile constraint).

### 6. Environment & local runnability
- [ ] Add `.env.local.example` with the exact Firebase env var names read by [src/lib/firebase.ts](src/lib/firebase.ts) (file does not currently exist in repo root).
- [ ] Confirm `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint` all pass cleanly.

### 7. End-to-end walkthrough (Definition of Done for MVP)
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
