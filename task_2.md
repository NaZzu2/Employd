# Employ'd — Task 2: Messaging System & Badge Limits

## Feature A: Employer-Initiated Messaging with Monthly Limits

### A1 — Types & Limits (`src/lib/types.ts`)
- [x] Add `seenAt?: string` field to the `Message` type (timestamp for read receipts)
- [x] Add `BADGE_LIMITS` constant: `Record<SubscriptionTier, number>` — free: 1 per interaction, pro/enterprise: higher
- [x] Confirm `THREAD_LIMITS` already exists: free=10, pro=50, enterprise=∞ ✓

### A2 — Firestore helpers (`src/lib/firestore.ts`)
- [x] Add `markMessageSeen(conversationId, messageId)` — sets `seenAt` timestamp on a message doc
- [x] Add `getOrCreateConversation(employer, workerId, workerName, jobPostId?, jobTitle?)` — checks if a conversation already exists between the pair before creating a new one (avoids duplicates)
- [x] Wire real-time listener: replace one-shot `getMessages()` call in `MessageThread` with `onSnapshot` so new messages appear live
- [x] In `sendMessage`, mark previous incoming messages as seen when sender sends (i.e., they've read them)

### A3 — Worker Card → Start Conversation flow (`src/components/dashboard/worker-card.tsx` & `src/app/dashboard/page.tsx`)
- [x] The "Message" button on `WorkerCard` should call `startConversation` (via `onStartConversation` prop) and then **navigate** the employer directly to `/dashboard/messages/<newConversationId>`
- [x] Show a loading/spinner state on the button while the conversation is being created
- [x] If a conversation already exists between this employer and worker, navigate to the existing thread instead of creating a new one
- [x] Show a toast with remaining monthly threads after starting (e.g., "Conversation started — 7 of 10 chats remaining this month")
- [x] If the monthly limit is reached, show a clear blocking dialog/toast explaining the limit and hinting at subscription upgrade

### A4 — Employer Messages List (`src/app/dashboard/messages/page.tsx`)
- [x] Replace mock data with real Firestore fetch: `getUserConversations(uid, 'employer')` (falls back to Finnish mock conversations when Firebase not configured)
- [x] Show unread indicator (bold name + coloured dot) on conversations that have messages with no `seenAt`
- [x] Display the monthly thread usage counter at the top (e.g., "X / 10 conversations used this month") with a subtle progress bar
- [x] Show an upgrade nudge when usage ≥ 80% of the limit (subscription hook — UI only for now)
- [x] Add real-time `subscribeToConversations` helper and wire it into the employer messages list so unread indicators update live
- [x] MessageThread fallback for local testing: show mock messages and allow local sends when Firebase not configured
- [x] Dev test page: add `/dev/messaging-test` to manually simulate chat UI locally

### A5 — Employer Chat View (`src/app/dashboard/messages/[conversationId]/page.tsx`)
- [x] Replace mock/static data with real `getConversation(id)` and worker profile fetch
- [x] Render `MessageThread` with the real `conversationId` and other party's name/avatar

### A6 — Worker Messages List (`src/app/worker/messages/page.tsx`)
- [x] Replace mock data with real Firestore fetch: `getUserConversations(uid, 'worker')`
- [x] Show unread indicator on conversations with unread messages from employer
- [x] Empty state copy: "No messages yet — employers will reach out here after reviewing your profile"

### A7 — Worker Chat View (`src/app/worker/messages/[conversationId]/page.tsx`)
- [x] Replace mock/static data with real `getConversation(id)` and employer profile fetch
- [x] Workers cannot send the first message — if the conversation has zero messages and the current user is a worker, show a read-only placeholder: "Waiting for the employer to start the conversation"
- [x] Once the employer has sent at least one message, enable the worker's send bar

### A8 — `MessageThread` component (`src/components/shared/message-thread.tsx`)
- [x] Switch from one-shot `getMessages` to a real-time `onSnapshot` listener
- [x] Display **sent timestamp** beneath each message bubble (exact time, e.g., "14:32" for today, "Mon 14:32" for older)
- [x] Display **"Seen"** with a tick icon beneath the sender's last message when `seenAt` is set
- [x] Call `markMessageSeen` when the other party's messages come into view (on mount + on new messages)
- [x] Disable the send input and hide the send button for workers when `isWorkerLocked` prop is true (no messages exist yet from employer)

### A9 — Firestore Security Rules (`firestore.rules`)
- [x] Ensure workers cannot call `startConversation` / create conversation docs (only employers)
- [x] Allow both parties to read/write messages within a conversation they belong to
- [x] Allow either party to update `seenAt` on messages sent by the other party

---

## Feature B: Badge Limit — 1 per Interaction (per Subscription)

### B1 — Types & Config (`src/lib/types.ts`)
- [x] Add `BADGE_LIMITS: Record<SubscriptionTier, number>` — `{ free: 1, pro: 3, enterprise: Infinity }`
- [x] Add helper note in comments: "badge limit applies per contract/review interaction"

### B2 — Firestore badge check (`src/lib/firestore.ts`)
- [x] Update `submitReview` to enforce badge limit: if the reviewer's subscription allows only 1 badge per review, ensure `badge` is capped at 1 (already the case structurally, but add explicit guard)
- [x] Add `getBadgesGivenInContract(fromUid, contractId)` helper that counts how many badges a user has already given in a specific contract's review — used to gate the picker

### B3 — Badge Picker UI (`src/components/shared/badge-display.tsx`)
- [x] Update `BadgePicker` to accept a `maxBadges?: number` prop (defaults to 1 for free tier)
- [x] When `maxBadges === 1` (free/standard), only allow selecting a single badge — clicking another deselects the previous one; the current single-select behaviour already works, but make it explicit
- [x] Show a subtle label: "1 badge per review (free plan)" with a locked icon next to extra badges
- [x] Add a small "Upgrade to give more badges" link/hint when limit is reached — subscription hook for later

### B4 — Review Form (`src/components/shared/review-form.tsx`)
- [x] Pass the caller's `subscriptionTier` (from `userDoc`) into `BadgePicker` as `maxBadges={BADGE_LIMITS[userDoc.subscriptionTier]}`
- [x] Validate on submit: if `badge` array length exceeds the tier limit, show an error toast and block submission
- [x] Display remaining badge allowance beneath the picker (e.g., "You can award 1 badge per review on your current plan")

---

## Feature C: Subscription Upgrade Hooks (UI stubs for later)

### C1 — Shared upgrade prompt component (`src/components/shared/upgrade-prompt.tsx`) [NEW]
- [x] Create a reusable `<UpgradePrompt reason="..." />` component that shows a card/banner: "Unlock more with a Pro plan" with a CTA button (disabled/placeholder for now)
- [x] Accept a `reason` prop: `'more_chats' | 'more_badges'` to customise the message
- [x] This component is used in the messaging limit banner and badge picker hint

### C2 — Subscription tier display (`src/app/dashboard/profile/page.tsx` & `src/app/worker/my-profile/page.tsx`)
- [x] Show current subscription tier badge on profile pages (e.g., "Free Plan")
- [x] Show monthly chat usage for employers: "X / 10 chats used"
- [x] Stub an "Upgrade Plan" button (no action yet)

---

## Verification
- [x] Employer clicks "Message" on a worker card → conversation created → redirected to chat
- [x] Second click on the same worker → navigates to existing conversation (no duplicate created)
- [x] Employer at limit (10 free) → blocking error toast shown, cannot start new chat
- [x] Worker visits messages tab → sees only conversations started by employers
- [x] Worker opens a chat with 0 employer messages → send bar is locked/hidden
- [x] Worker opens a chat after employer's first message → can reply freely
- [x] Messages show exact timestamps and "Seen ✓" when read
- [x] New messages appear in real-time without page refresh
- [x] Review form: only 1 badge selectable on free tier; selecting a second deselects the first
- [x] Upgrade prompt appears when chat limit ≥ 80% or badge limit is reached
