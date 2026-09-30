# Employ'd — MVP Summary

## What This MVP Is

Employ'd is a two-sided job marketplace connecting **employers** (desktop/browser-first) with **employees** (mobile-phone-first). It replaces cold, anonymous job boards with a lightweight, trust-building loop: post a job → find someone → talk → agree → work → rate each other.

## Core Functionality (Current State)

### 1. Role-Based Accounts
- Sign up / log in with Firebase Authentication.
- Every account is tagged `employer` or `employee` at signup, driving all routing and permissions.
- Employers land on `/dashboard/*` (desktop sidebar layout); employees land on `/worker/*` (mobile bottom-nav layout).

### 2. Profiles
- Employers create/edit a company profile: name, industry, description, location, contact info.
- Employees create/edit a worker profile: title, skills, location, availability ("looking for work"), summary.
- Both profiles display aggregate star rating, badge counts, and review history — so trust accumulates visibly over time.

### 3. Job Posting & Discovery
- Employers post jobs with title, type, location, salary, description, and requirements; they can edit or close jobs at any time.
- Employees browse a real-time job board filtered by skill, location radius, and search text — new jobs appear instantly without a page refresh.
- Employers can also proactively browse a filterable "worker pool" of available employees rather than only waiting for pings.

### 4. Expressing Interest ("Pings")
- Employees "ping" a job to signal interest without committing to a full conversation — a low-friction first step.
- Employers see pings on a dedicated inbox and on each job's "Interested Workers" list, with worker profile, rating, and message.

### 5. Messaging
- **Employer-initiated**: only employers can open a new conversation (with a worker card, from the worker pool, or from a ping) — this keeps the platform spam-resistant, since employees can't be message-bombed by unsolicited employer chat, and employers can't be flooded by every applicant on every job.
- Real-time delivery via Firestore `onSnapshot`, with read receipts, timestamps, message length caps, and rate limiting to prevent abuse.
- Per-subscription-tier monthly thread limits are already wired in, so the messaging system is future-proof for monetization without extra plumbing.

### 6. Contracts (Non-Legal Hire Record)
- Employer marks an employee as hired via a lightweight, **non-legal** contract record tied to the job.
- Employee explicitly accepts or declines — nothing is assumed or automatic.
- Employer can later mark the contract complete.
- Planned: once a contract is accepted, the associated chat thread automatically locks to read-only (preserving history, closing the door on further back-and-forth) — keeping the "chat" phase and the "working relationship" phase cleanly separated.

### 7. Reviews & Badges
- After a contract is accepted, either party can leave a 1–5 star review and award one badge (Punctual, Reliable, Quality, Professional, Goes Above) to the other.
- Badge and rating totals aggregate onto the recipient's public profile, creating a visible, portable reputation for both employers and employees.

### 8. Mobile vs. Desktop Split
- The employee experience is deliberately mobile-first: bottom-tab navigation, phone-width-constrained layout, large tap targets — built to be used on the actual job site or on the go.
- The employer experience is desktop-first: a full sidebar dashboard suited to managing multiple job posts, conversations, and workers at once from an office/back-office context.

## Why This Is a Good MVP

- **It proves the full core loop end-to-end**: post → discover → ping → message → hire → review, with no dead ends or fake/mocked steps standing in for real functionality.
- **It matches how each side actually works**: employers manage postings and pipelines from a desktop; employees search and respond from their phone. The product isn't a compromise "one layout fits all" — it's tailored to real usage context.
- **It's spam- and abuse-resistant by default**: employer-only chat initiation, message rate/length limits, monthly thread caps, and duplicate-ping prevention are all already enforced, not "left for later."
- **Trust is built into the data model, not bolted on**: reviews and badges are gated behind an actual accepted contract, so reputation can't be gamed by reviewing without ever transacting.
- **It's cheap to extend, not a dead end**: subscription tiers, thread/badge limits, and billing hooks are already wired through the type system and Firestore rules, so monetization is a matter of turning on Stripe rather than re-architecting.
- **Non-legal contracts keep scope honest**: the platform makes hiring intent explicit and trackable without pretending to be a legal/HR system — appropriate for an MVP that needs to ship fast and iterate.
- **Security is enforced at the data layer, not just the UI**: Firestore rules independently mirror every client-side permission check (who can create a conversation, who can review whom, message size limits), so the MVP isn't relying on "the UI won't let you" as its only safeguard.

## What's Deliberately Left Out (and why that's fine for MVP)
- Real payment processing (Stripe) — a mock billing flow proves the UX without payment risk before real money is involved.
- PWA/offline support — not needed to validate the core marketplace loop.
- Automated tests/CI — acceptable short-term trade-off for a pre-validation MVP; tracked as follow-up work, not a hidden gap.
- Server-side badge-limit enforcement — client-side check is sufficient at MVP trust levels; not a security hole for reviews (which still require a real contract).

See [PRODUCT_PLAN.md](PRODUCT_PLAN.md) for the authoritative requirements, implementation status, and remaining MVP checklist, and [TASKS.md](TASKS.md) for the broader backlog beyond MVP scope.
