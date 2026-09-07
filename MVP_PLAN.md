# Employ'd — MVP Definition & Plan

> Companion to [CONTEXT.md](CONTEXT.md) and [PLAN.md](PLAN.md). PLAN.md is the full hardening roadmap; this file scopes down to the smallest set of working features ("MVP") that satisfies the original goal, and gives a strict execution order to reach it. Where this file's scope differs from PLAN.md (e.g. billing deferred), this file wins for MVP purposes.

## MVP Goal Statement
A working product, usable today by a real employer (in a desktop browser) and a real employee (on a mobile phone browser), that lets them:
1. Sign up / log in with a role (employer or employee).
2. Create and edit a profile (company profile for employer, worker profile for employee).
3. Employer posts jobs; employee browses/searches jobs.
4. Employee expresses interest ("ping") in a job; employer can message the employee (and vice versa once a thread exists), with basic anti-spam limits.
5. Employer marks an employee as hired via a non-legal "contract" record; employee accepts/declines.
6. After a contract, either party can leave a star review and award a badge, visible on the other's profile.

Everything else (subscription billing/Stripe, PWA installability, badge-limit rule enforcement in Firestore rules, CI, advanced analytics) is explicitly **out of scope for MVP** and deferred to [PLAN.md](PLAN.md).

## Verified Current State (what already exists in code)
Based on direct inspection of the repo:
- Auth: real Firebase email/password auth with role stored on `users/{uid}.role` — [src/lib/auth-context.tsx](src/lib/auth-context.tsx). ✅ Done.
- Role routing: `/dashboard/*` (employer, desktop sidebar) vs `/worker/*` (employee, mobile bottom-nav, width-constrained to phone size even on desktop) — [src/app/worker/layout.tsx](src/app/worker/layout.tsx), [src/components/dashboard/dashboard-sidebar.tsx](src/components/dashboard/dashboard-sidebar.tsx). ✅ Done.
- Profiles: `workerProfiles/{uid}`, `employerProfiles/{uid}` with full CRUD helpers — [src/lib/firestore.ts](src/lib/firestore.ts). ✅ Done.
- Jobs: `jobPosts` create/read/update/paginate/subscribe — ✅ Done. Pages exist under [src/app/dashboard/post-job](src/app/dashboard/post-job), [src/app/dashboard/my-jobs](src/app/dashboard/my-jobs), [src/app/worker/jobs](src/app/worker/jobs).
- Pings: `pings` collection with employer/worker query helpers and status update — ✅ Done. Pages: [src/app/dashboard/pings](src/app/dashboard/pings).
- Messaging: `conversations` + `messages` subcollection, real-time `onSnapshot` listeners, thread limits by subscription tier, read receipts (`seenAt`) — ✅ Done, but **no server-enforced message length/rate limit yet** (gap, see below).
- Contracts: `contracts` collection, create/accept/decline/complete flow, pages under both [src/app/dashboard/contracts](src/app/dashboard/contracts) and [src/app/worker/contracts](src/app/worker/contracts). ✅ Done, non-legal by design (no e-sign, no legal text).
- Reviews & Badges: `reviews` collection tied to `contractId`, 5 badge types, aggregate rating mirrored onto both `users/{uid}` and role-specific profile doc — [src/lib/firestore.ts](src/lib/firestore.ts) `submitReview`. ✅ Done client-side; badge-count limit enforcement is client-only (acceptable for MVP, hardened later in PLAN.md Step 4).
- Security rules: [firestore.rules](firestore.rules) cover all collections above with correct owner/participant checks. ✅ Done.
- Missing/incomplete for MVP:
  - `.env.local.example` file does not exist in the repo (confirmed via search) — new devs cannot know which env vars to set. **Gap.**
  - `public/` only has `favicon.ico` — no app icons, no manifest (fine, PWA is out of scope for MVP, but confirm no broken image references).
  - No automated tests anywhere.
  - No CI.
  - Subscription/billing (task_8.md) unfinished — **explicitly excluded from MVP**, employer plan can stay hardcoded to `free` tier limits which already work (`THREAD_LIMITS.free = 10`).

**Conclusion: the MVP is functionally ~90% built already.** The remaining work is closing small gaps, verifying end-to-end flows actually run, and adding the one safety-relevant fix (message limits) — not building new large features.

---

## MVP Scope Boundaries (explicit in/out)

**In scope:**
- Signup/login, role redirect.
- Employer: post/edit/close job, browse worker profiles, message a worker, create a contract, leave a review+badge after contract completion.
- Employee: browse/search jobs, ping a job, message an employer, accept/decline a contract, leave a review+badge after contract completion.
- Profiles display reviews + badges + average rating.
- Basic mobile responsiveness for `/worker/*` (already phone-width-constrained) and basic responsive/desktop layout for `/dashboard/*`.
- Message length cap + basic send-rate cooldown (safety minimum, cheap to add).

**Out of scope (deferred, tracked in [PLAN.md](PLAN.md)):**
- Stripe/subscription upgrade flow.
- PWA installability / service worker / offline support.
- Server-side (Firestore rules) badge-limit enforcement.
- CI pipeline.
- Automated test suite (a minimal smoke test is nice-to-have but not blocking MVP ship).
- AI recommendation flows under [src/ai](src/ai) (leave as-is, not required for MVP core loop).

---

## MVP Execution Plan (strict order)

### Step 1 — Environment & Local Runnability (must be first)
1. Create `.env.local.example` at repo root with placeholders for: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`. Check [src/lib/firebase.ts](src/lib/firebase.ts) for the exact variable names it reads (`process.env.NEXT_PUBLIC_FIREBASE_*`) and match them exactly.
2. Copy it to `.env.local` locally, fill with a real (or Firebase emulator) project's config.
3. Run `npm install`, then `npm run dev`, confirm the app loads at `http://localhost:9002` without console errors.

**DoD:** App boots locally, login page renders, no Firebase "invalid config" errors in console.

### Step 2 — End-to-End Manual Walkthrough (defines "MVP works")
Perform this exact scripted walkthrough using two browser sessions (one normal, one incognito) or one desktop browser + one real phone on the same network pointed at the dev server's LAN address:

1. Sign up as Employer A (desktop browser) → confirm redirect to `/dashboard`.
2. Complete Employer A's company profile at `/dashboard/profile`.
3. Post a job at `/dashboard/post-job` → confirm it appears at `/dashboard/my-jobs`.
4. Sign up as Employee B (phone browser, or mobile viewport) → confirm redirect to `/worker`.
5. Complete Employee B's worker profile at `/worker/my-profile`.
6. Browse jobs at `/worker` (or `/worker/jobs`) → find Employer A's job → send a ping.
7. As Employer A, view the ping at `/dashboard/pings` → accept it.
8. As Employer A, open Employee B's worker card → click "Message" → confirm a conversation is created and opens at `/dashboard/messages/[id]`.
9. Send 2–3 messages back and forth between both sessions → confirm real-time delivery and read receipts (`seenAt`) update.
10. As Employer A, create a contract for Employee B tied to the job.
11. As Employee B, view pending contract at `/worker/contracts` → accept it.
12. As Employer A, mark the contract complete.
13. As Employer A, submit a review + 1 badge for Employee B.
14. As Employee B, submit a review + 1 badge for Employer A.
15. Confirm both profiles now show updated average rating and badge counts.

**DoD:** All 15 steps complete with no unhandled errors, no blank/crash screens, and correct data appears on both profiles at the end. Log any failing step precisely (URL + action + error) — each failure becomes a fix task in Step 4.

### Step 3 — Minimum Safety Fix: Message Limits
(Same technical change as PLAN.md Step 2, but scoped to just the minimum needed for MVP — no rules-unit-test required for MVP, just working enforcement.)

1. In [src/lib/types.ts](src/lib/types.ts) add: `export const MAX_MESSAGE_LENGTH = 2000;`
2. In [src/lib/firestore.ts](src/lib/firestore.ts) `sendMessage`: reject (throw) empty or >2000-char text before writing.
3. In [firestore.rules](firestore.rules) under the `messages` `allow create` rule, add `&& request.resource.data.text.size() > 0 && request.resource.data.text.size() <= 2000`.
4. In the chat input UI (find via grep for `sendMessage(` in `src/components` and `src/app`), add a character counter and disable send past the limit; wrap the `sendMessage` call in try/catch and show existing toast hook ([src/hooks/use-toast.ts](src/hooks/use-toast.ts)) on error.

**DoD:** Attempting to send an empty message or one over 2000 characters is blocked both in the UI and (if tested directly against Firestore) by security rules.

### Step 4 — Bug Fix Pass
Fix every issue logged during Step 2's walkthrough, in the order encountered. For each fix:
1. Identify the exact file/component causing the failure (use `grep_search`/`read_file`, do not guess).
2. Make the minimal correct fix — do not refactor unrelated code.
3. Re-run only the affected step(s) of the Step 2 walkthrough to confirm the fix.

**DoD:** Full Step 2 walkthrough passes start to finish with zero errors.

### Step 5 — Mobile Verification Pass (phone-specific, not just responsive-in-devtools)
1. Run `npm run build && npm run start`.
2. On the same LAN, open `http://<dev-machine-LAN-ip>:9002` (or the port used by `start`) on a real Android and/or iOS phone browser.
3. Repeat the employee half of the Step 2 walkthrough (steps 4–9, 11, 14) entirely on the physical phone.
4. Check: bottom nav is reachable and not obscured by phone browser chrome; forms are usable with on-screen keyboard; no horizontal scroll/overflow; tap targets are large enough (≥40px).

**DoD:** Employee's full core loop (profile, browse, ping, message, accept contract, review) works on a real phone with no layout breakage.

### Step 6 — Ship Checklist
1. Confirm `npm run typecheck`, `npm run lint`, `npm run build` all pass (zero errors).
2. Confirm [firestore.rules](firestore.rules) is deployed to the target Firebase project (`firebase deploy --only firestore:rules`).
3. Confirm production env vars are set in the hosting target (see [apphosting.yaml](apphosting.yaml) / Firebase Hosting config), matching `.env.local.example` keys from Step 1.
4. Tag this state as `v0.1.0-mvp` (git tag) once Steps 1–5 are all done.

**DoD:** Tag exists; app is deployed and reachable at the production URL; a fresh signup→core-loop walkthrough (Step 2) succeeds against the deployed production URL, not just localhost.

---

## After MVP
Once this file's Step 6 is complete, resume work using [PLAN.md](PLAN.md) starting at its Step 1 (testing foundation), since the MVP intentionally skipped automated tests and CI.

---

## Implementation Log (completed by agent — {{date}} Sept 7, 2026)

### Step 1 — Environment & Local Runnability ✅
- [.env.local.example](.env.local.example) already existed with the correct Firebase variable names matching [src/lib/firebase.ts](src/lib/firebase.ts). No changes needed.
- `npm install` confirmed `node_modules` already present.

### Step 2 — Manual Walkthrough — done as static code review (agent cannot drive two live browser sessions or a physical phone)
Reviewed every file in the core loop instead of click-testing. Found and logged real bugs (see Step 4).

### Step 3 — Message Limits — ✅ implemented
- Added `MAX_MESSAGE_LENGTH = 2000` and `MESSAGE_MIN_INTERVAL_MS = 5000` to [src/lib/types.ts](src/lib/types.ts).
- `sendMessage` in [src/lib/firestore.ts](src/lib/firestore.ts) now throws on empty/over-length text and enforces a 5s cooldown per sender per conversation (checked via last message query).
- [firestore.rules](firestore.rules) `messages` create rule now requires `text.size() > 0 && text.size() <= 2000`.
- [src/components/shared/message-thread.tsx](src/components/shared/message-thread.tsx) now shows a live `"N / 2000"` character counter, disables Send past the limit, and surfaces thrown errors (including the cooldown message) via the existing toast hook.

### Step 4 — Bug Fix Pass — ✅ done for all issues found via `npm run typecheck` / `npm run build`
Fixed real, pre-existing bugs (not hypothetical):
1. [src/app/dashboard/my-jobs/[id]/interested/page.tsx](src/app/dashboard/my-jobs/[id]/interested/page.tsx) — the file contained the entire component **tripled** (copy-paste error), causing 78 duplicate-identifier compile errors. Rewrote as a single clean copy, and replaced the "Hire (stub)" button — which only showed a toast and did nothing — with a real call to `createContract(...)`, matching the pattern already used in [src/app/dashboard/workers/page.tsx](src/app/dashboard/workers/page.tsx). This directly enables MVP walkthrough step 10 (employer creates a contract) from the "Interested Workers" list, not just from the general worker browse page.
2. [src/app/dashboard/profile/page.tsx](src/app/dashboard/profile/page.tsx) — `profile.location` is optional in the `EmployerProfile` type but was accessed as if always defined (`profile.location.address`, `.lat`, `.lng`), causing compile errors and a potential runtime crash for any employer without a saved location. Added `?.` guards with sensible fallbacks in the form inputs and the preview section.
3. [src/components/theme-provider.tsx](src/components/theme-provider.tsx) — imported `ThemeProviderProps` from a `next-themes` internal path (`next-themes/dist/types`) that no longer exists in the installed version, breaking the build. Replaced with `React.ComponentProps<typeof NextThemesProvider>`.
4. [src/components/ui/calendar.tsx](src/components/ui/calendar.tsx) — unused shadcn boilerplate (confirmed via workspace search — no imports anywhere) with types incompatible with the installed `react-day-picker` v9. Cast the custom icon-components object to satisfy the type-checker since the component isn't part of the MVP loop.
5. [src/app/api/billing/create-checkout/route.ts](src/app/api/billing/create-checkout/route.ts) — called `cookies()` synchronously; Next.js 15 made this API async. Added `await`.
6. [src/app/api/billing/webhook/route.ts](src/app/api/billing/webhook/route.ts) and [src/lib/billing.ts](src/lib/billing.ts) — Stripe SDK's installed type definitions expect a newer `apiVersion` literal than the hardcoded `'2022-11-15'`; cast to `any` to keep the explicit API version pin without forcing an SDK upgrade.
7. [src/lib/billing.ts](src/lib/billing.ts) — referenced `admin.firestore.FieldValue` without importing the `firebase-admin` namespace correctly, causing a compile error. Switched to importing `FieldValue` directly from `firebase-admin/firestore`.
8. A stale `.next` type-cache entry for `/dashboard/jobs/[id]` was also reported by `tsc`; cleared via deleting `.next` (regenerated on next build).

**Result:** `npm run typecheck` and `npm run build` both now complete with zero errors (previously 94 errors across 8 files). Full build output confirms every route in both `/dashboard/*` and `/worker/*` compiles successfully.

**Known deferred issue:** `npm run lint` (`next lint`) is broken independent of this codebase — Next 15.5's ESLint bootstrap conflicts with the installed ESLint 9 flat-config, producing a "circular structure" error while writing `.eslintrc.json`. This does not affect the app's runtime or build. Fixing the lint toolchain (likely migrating to a flat `eslint.config.mjs` per Next's own suggested codemod) is deferred — track under [PLAN.md](PLAN.md) Step 6 (CI) since CI setup will need working lint anyway.

### Step 5 — Mobile Verification — ⚠️ requires a human with a physical device; agent cannot perform this
Cannot be completed by an automated agent (no access to a real phone or network-attached device). To complete this step yourself:
1. Run `npm run build && npm run start`.
2. Find your machine's LAN IP (`ipconfig` on Windows) and open `http://<LAN-IP>:9002` on a real phone browser connected to the same Wi-Fi.
3. Walk through the employee steps (signup → profile → browse jobs → ping → message → accept contract → review) exactly as scripted above.
4. Confirm bottom nav, forms, and tap targets behave correctly (see checklist above).

### Step 6 — Ship Checklist — partially completed by agent
- ✅ `npm run typecheck` — passes, 0 errors.
- ⚠️ `npm run lint` — broken toolchain issue (see above), not app-breaking; deferred.
- ✅ `npm run build` — passes, all 30+ routes compile.
- ⏳ Deploying [firestore.rules](firestore.rules) (`firebase deploy --only firestore:rules`) and setting production env vars — requires actual Firebase project credentials/CLI login, which the agent does not have access to. Run this yourself once ready to deploy.
- ⏳ Git tag `v0.1.0-mvp` — recommend tagging once you've personally completed Step 5 (physical phone check) and deployed rules, since those two require human/device access this agent doesn't have.
