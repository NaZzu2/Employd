# Employ'd — Task 3: Employee Messaging & Finnish Job Listings

## Overview
Build a bidirectional messaging platform where **employees can message employers** (symmetric to Task 2), and create dummy Finnish job listings focused on construction and car mechanics that employees can ping.

---

## Feature A: Employee-Initiated Messaging with Employers

### A1 — Reuse Existing Firestore Infrastructure
- [ ] Verify `Message`, `Conversation`, and related types support bidirectional messaging (they should already)
- [ ] Confirm `sendMessage` and `subscribeToMessages` work for employee → employer direction
- [ ] Confirm `markMessageSeen` works bidirectionally

### A2 — Employee Messages List (`src/app/employee/messages/page.tsx`)
- [ ] Create new `/employee/messages/page.tsx` route
- [ ] Replace mock data with real Firestore fetch: `getUserConversations(uid, 'employee')`
- [ ] Show unread indicator (bold name + coloured dot) on conversations with unread messages
- [ ] Display recent message preview and timestamp
- [ ] Empty state copy: "No conversations yet — start by pinging a job or replying to an employer"
- [ ] Real-time listener: `subscribeToConversations` to update unread indicators live

### A3 — Employee Chat View (`src/app/employee/messages/[conversationId]/page.tsx`)
- [ ] Create new route for individual conversations
- [ ] Fetch real `getConversation(id)` and employer profile data
- [ ] Render `MessageThread` with real `conversationId` and employer's name/avatar
- [ ] Display employer's name and profile link at the top

### A4 — Start Conversation from Job Listing
- [ ] Add "Message Employer" button on job detail pages
- [ ] Button calls `getOrCreateConversation(employee, employerId, employerName)` 
- [ ] Navigate to `/employee/messages/<conversationId>` on success
- [ ] Show loading spinner while conversation is being created
- [ ] If conversation already exists, navigate to existing thread (no duplicates)
- [ ] Show toast: "Conversation started with [Employer Name]"

### A5 — MessageThread Component (Already Reusable)
- [ ] Verify `MessageThread` works for both employee ↔ employer messaging
- [ ] Timestamps display correctly
- [ ] "Seen ✓" receipts appear when messages are read
- [ ] Real-time updates work

### A6 — Firestore Security Rules
- [ ] Ensure employees can create conversations with employers
- [ ] Allow both parties to read/write messages
- [ ] Allow either party to update `seenAt` on received messages

---

## Feature B: Dummy Finnish Job Listings (Construction & Car Mechanics)

### B1 — Create Dummy Employer Account
- [ ] Create a test employer user in Firestore: `users/{testEmployerId}` with role='employer'
  - Name: "Suomalainen Rakentajat Oy" (or similar)
  - Email: something recognizable for testing
  - subscriptionTier: 'pro' (to allow multiple jobs)
  - Location: Helsinki, Finland (lat: 60.1699, lng: 24.9384)

### B2 — Create Dummy Construction Job Posts
- [ ] Job 1: "Kirvesmies palkataan remonttitöihin"
  - Title: Carpentry/Renovation
  - Description: Seeking skilled carpenter for residential renovation project
  - Skills: Carpentry, Finish Work, Drywall
  - Location: Helsinki
  - Pay range: €25-35/hour
  - Status: active

- [ ] Job 2: "Sähköasentaja tarvitaan uudiskohteeseen"
  - Title: Electrician for New Build
  - Description: Electrical wiring for new construction project
  - Skills: Electrical Wiring, Commercial Standards, Safety
  - Location: Espoo
  - Pay range: €28-38/hour
  - Status: active

- [ ] Job 3: "Putkiasentaja urakkahommiin"
  - Title: Plumber for Contract Work
  - Description: Plumbing installation and repairs
  - Skills: Plumbing, Pipe Installation, Troubleshooting
  - Location: Vantaa
  - Pay range: €24-32/hour
  - Status: active

### B3 — Create Dummy Car Mechanics Job Posts
- [ ] Job 4: "Autonasentaja auto- ja kuorma-autoille"
  - Title: Auto Mechanic (Cars & Trucks)
  - Description: General maintenance and repair of cars and commercial vehicles
  - Skills: Engine Repair, Diagnostics, Welding
  - Location: Helsinki
  - Pay range: €26-36/hour
  - Status: active

- [ ] Job 5: "Rengashuollon ammattilainen"
  - Title: Tire & Suspension Specialist
  - Description: Tire changes, alignment, suspension work
  - Skills: Tire Maintenance, Wheel Alignment, Suspension
  - Location: Turku
  - Pay range: €22-28/hour
  - Status: active

- [ ] Job 6: "Autojen korjaaja erikoistuneesti sähkö- ja hybridivoiman"
  - Title: EV/Hybrid Specialist
  - Description: Electric and hybrid vehicle maintenance and repair
  - Skills: EV Systems, Battery Diagnostics, High Voltage Safety
  - Location: Tampere
  - Pay range: €30-40/hour
  - Status: active

### B4 — Seed Jobs to Firestore
- [ ] Use Firebase Admin SDK or manual console creation to insert 6 dummy job posts
- [ ] Verify all jobs appear in employee job board (`/employee/jobs` or similar)
- [ ] Verify jobs are searchable and filterable by skill/location

---

## Feature C: Employee Job Board & Pinging

### C1 — Employee Job Board Page (`src/app/employee/jobs/page.tsx`)
- [ ] Create new route to display available job listings
- [ ] Fetch all active job posts: `getActiveJobPosts()`
- [ ] Display job card with:
  - Job title, description, skills, location
  - Employer name and avatar
  - Pay range
  - "Interested" / "Message Employer" button
- [ ] Search/filter by:
  - Job title or description
  - Skills
  - Location (with radius filter)
- [ ] Empty state: "No jobs available in your area"

### C2 — Ping Functionality (Reuse from Task 2)
- [ ] Verify `sendPing(employeeId, jobPostId, employerId, ...)` works for this direction
- [ ] "Interested" button on job cards calls ping function
- [ ] Show toast: "You've expressed interest — the employer will be notified"
- [ ] After pinging, navigate to `/employee/messages/<conversationId>` or show messaging prompt
- [ ] Loading spinner while ping is being sent

### C3 — Job Detail Page (`src/app/employee/jobs/[id]/page.tsx`)
- [ ] Display full job details
- [ ] Show employer profile card
- [ ] "Message Employer" button (creates conversation)
- [ ] "Express Interest" / "Ping" button (sends ping)
- [ ] Related jobs from same employer

---

## Feature D: Navigation & Layout for Employees

### D1 — Employee Layout Routes
- [ ] Verify `/employee` has proper layout structure
- [ ] Create/update bottom nav for mobile with links to:
  - `/employee/jobs` (Job Board)
  - `/employee/messages` (Conversations)
  - `/employee/reviews` (Reviews & Ratings)
  - `/employee/my-profile` (Profile)
- [ ] Update sidebar for desktop if needed

### D2 — Employee Profile Sidebar/Nav
- [ ] Show current user's role badge: "Employee"
- [ ] Show subscription tier
- [ ] Link to `/employee/my-profile`
- [ ] Link to `/employee/jobs`

---

## Feature E: Firestore Data Model Alignment

### E1 — Verify Collections & Documents
- [ ] `users/{uid}` — role='employee' users exist or can be created
- [ ] `jobPosts/{jobId}` — all 6 dummy jobs seeded correctly
- [ ] `conversations/{convId}` — supports employee ↔ employer bidirectionally
- [ ] `messages/{msgId}` — works for both directions
- [ ] `pings/{pingId}` — employee can ping on job posts

### E2 — Firestore Security Rules
- [ ] Employees can query active job posts
- [ ] Employees can send pings on jobs
- [ ] Employees can message employers
- [ ] Employees cannot create job posts (only employers)

---

## Feature F: UI Components (Reuse & Minor Customization)

### F1 — Reuse from Task 2
- [ ] `MessageThread` — works as-is for employee ↔ employer
- [ ] `BadgeDisplay` — display employer badges on job cards
- [ ] `StarRatingDisplay` — show employer rating on job cards
- [ ] `UpgradePrompt` — optional upsell on limited actions

### F2 — New/Minor Components
- [ ] `JobCard` — similar to `WorkerCard`, shows job details
- [ ] `JobDetailHeader` — job title, employer, pay range
- [ ] `JobSearchFilters` — search by title, skills, location

---

## Verification

### Messaging Verification
- [ ] Employee clicks "Message Employer" on job card → conversation created → redirected to chat
- [ ] Second click on same employer → navigates to existing conversation (no duplicate)
- [ ] Employee visits `/employee/messages` → sees only conversations with employers
- [ ] Employee receives message from employer → shows unread indicator
- [ ] Messages display timestamps and "Seen ✓" when read
- [ ] New messages appear in real-time

### Job Listing Verification
- [ ] All 6 dummy jobs visible in `/employee/jobs`
- [ ] Jobs are filterable by location and skills
- [ ] Jobs display correct employer name and pay range
- [ ] Employee can view job details in `/employee/jobs/[id]`
- [ ] Job detail shows employer profile card

### Pinging Verification
- [ ] Employee clicks "Interested" on job → ping sent → toast shown
- [ ] Employer receives ping notification (if system implemented)
- [ ] Conversation created automatically after ping (optional flow)
- [ ] Employee can message employer after pinging job

---

## Notes
- All messaging logic reuses Task 2 infrastructure; no new firestore functions needed
- Mock data fallback available for local testing when Firebase not configured
- Employee role treated identically to worker role in most contexts
- Finnish job descriptions and names enhance local testing experience
