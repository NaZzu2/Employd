# Employ'd — Task 4: Employer Profiles & Real Job Posting + Job Board Real-Time Sync

## Overview
Enable employers to build and manage real profiles, create job postings that appear live on the worker job board with real-time filtering, and establish bidirectional conversations. Workers can discover jobs, ping employers (creating conversations), and employers can respond immediately in real-time messaging.

---

## Feature A: Employer Profile Setup & Management

### A1 — Employer Signup/Onboarding Flow
- [x] Create `/dashboard/setup` route for first-time employer setup
- [ ] Collect employer information:
  - Company name (required)
  - Industry (required, dropdown: Construction, Manufacturing, Services, IT, Other)
  - Company description (required, textarea)
  - Location (required, map picker with lat/lng)
  - Website URL (optional)
  - Company logo/avatar (optional, image upload)
  - Contact email (autofilled from auth)
- [x] Save to `employerProfiles/{uid}` in Firestore
- [ ] Create entry in `users/{uid}` with role='employer' if not exists
- [x] Redirect to `/dashboard` after setup complete
- [x] Show toast: "Profile created successfully!"

### A2 — Employer Profile Page (`/dashboard/profile`)
- [x] Display current employer profile info
- [x] Allow editing all fields from A1
- [ ] Show subscription tier and monthly thread limit usage
- [x] Display average rating and review count (fetched from `users/{uid}`)
- [ ] Button to upgrade subscription tier (optional flow)
- [ ] Delete/Deactivate account option (optional for MVP)
- [x] Save button with validation and error handling
- [x] Success toast: "Profile updated successfully!"

### A3 — Profile Completion Guard
- [x] Check if employer has `employerProfiles/{uid}` on `/dashboard` load
- [x] If missing, redirect to `/dashboard/setup`
- [x] Allow skipping setup with "Skip for now" button (but show banner reminder)
- [ ] Prevent posting jobs until profile is created

---

## Feature B: Job Posting & Management

### B1 — Create Job Post Form (`/dashboard/post-job`)
- [x] Form fields:
  - Job title (required, text input)
  - Job type (required, dropdown: Full-time, Part-time, Contract)
  - Description (required, textarea with markdown support)
  - Requirements (required, list input - add/remove fields)
  - Location (required, map picker or address search with lat/lng)
  - Salary/pay (required, text field: "€20-30/hour" or similar)
  - Job status (auto-set to 'active')
- [x] Validate all required fields before submit
- [x] Call `createJobPost(jobData)` Firestore function
- [x] Show loading spinner during submission
- [x] On success:
  - Toast: "Job posted successfully!"
  - Redirect to `/dashboard/my-jobs`
- [x] On error: Show error toast with message

### B2 — Job List & Management (`/dashboard/my-jobs`)
- [x] Display all jobs posted by current employer
- [x] For each job show:
  - Job title, type, location
  - Posted date
  - Status badge (active/closed)
  - [ ] Number of pings received
  - [ ] Number of applications/conversations
- [ ] Sort by: Most Recent, Most Pings, Active Status
- [ ] Filter by status: All, Active, Closed
- [x] Actions per job:
  - "View Details" → `/dashboard/my-jobs/[id]`
  - "Edit" → `/dashboard/my-jobs/[id]/edit`
  - "Close" → Changes status to 'closed' (soft delete, keep in DB)
  - [ ] "View Interested" → Shows list of workers who pinged
- [x] Empty state: "You haven't posted any jobs yet"
- [x] "Post New Job" button → `/dashboard/post-job`

### B3 — Job Detail & Edit (`/dashboard/my-jobs/[id]` & `/dashboard/my-jobs/[id]/edit`)
- [ ] View mode:
  - [x] Display all job details
  - [ ] Show number of views (query count from interactions)
  - [ ] Show list of interested workers (pings)
  - [ ] Show conversations related to this job
- [ ] Edit mode:
  - [ ] All fields from B1 editable except job type
  - [x] Save button calls `updateJobPost(jobId, changes)`
  - [x] Success toast: "Job updated successfully!"
- [ ] Close job button with confirmation modal
  - Status → 'closed'
  - No longer appears on worker job board
  - Existing conversations remain active

---

## Feature C: Job Visibility on Worker Side (Real-Time)

### C1 — Worker Job Board Reads Real Data
- [x] Update `/worker/jobs/page.tsx` to fetch real active job posts from Firestore
- [x] Fetch from `jobPosts` collection with filters:
  - `where('status', '==', 'active')`
  - `orderBy('postedAt', 'desc')`
- [x] Display each job using existing `EmployeeJobCard` component
- [x] Search filters work on real data:
  - Search: title, description, company name (case-insensitive)
  - Skills: filter by requirements array
  - Location + Radius: use geospatial query or client-side distance calc
- [x] Real-time updates: `onSnapshot()` listener so new jobs appear immediately
- [x] Loading state while fetching
- [x] Empty state: "No jobs available in your area"

### C2 — Filter & Search Optimization
- [x] Geospatial filtering logic:
  - Get worker's location from `userDoc.location`
  - Filter radius: default 50km, adjustable 10-200km
  - Use `isWithinRange()` utility to check distance
- [ ] Pagination or virtual scroll if many jobs (optional for MVP)
- [ ] Debounced search input (300ms) to reduce queries
- [x] Apply filters client-side or via Firestore queries

### C3 — Real-Time Job Updates
- [x] When employer posts/updates job → worker job board refreshes automatically
- [x] When employer closes job → job disappears from worker board
- [x] Use `onSnapshot()` listener on `jobPosts` collection
- [ ] Handle connection/reconnection smoothly

---

## Feature D: Worker Interaction - Ping & Messaging

### D1 — Ping System (Reuse/Verify)
- [x] Worker clicks "Interested" on job card → `sendPing(workerId, jobPostId, employerId, jobTitle)`
- [x] Firestore creates entry in `pings/{pingId}` with:
  - workerId, jobPostId, employerId, jobTitle
  - Status: 'pending'
  - createdAt: ISO timestamp
- [x] On success:
  - [x] `getOrCreateConversation()` called automatically
  - [x] Toast: "You've expressed interest!"
  - [x] Redirect to `/worker/messages/{conversationId}` after 1-2 second delay
- [ ] Prevent duplicate pings (check if already pinged this job)
- [x] Loading spinner during ping submission

### D2 — Employer Receives Ping (Dashboard Alert)
- [x] Add "Pings" section to `/dashboard` home showing recent pings
- [x] Display: Worker name, avatar, job title, "View Worker" link
- [ ] Click "View Worker" → navigate to worker's profile or messaging thread
- [ ] Real-time updates: new pings appear immediately via `onSnapshot()`
- [ ] Optional: Bell icon with unread count

### D3 — Conversation Creation from Ping
- [x] When worker pings, `getOrCreateConversation()` called
- [x] Conversation created with:
  - [x] workerId, workerName
  - [x] employerId, employerName
  - [x] jobPostId, jobTitle (from ping context)
- [x] Both parties can see conversation in their message list
- [x] First message optional (worker can message employer or wait for response)

---

## Feature E: Bidirectional Messaging

### E1 — Employer Message List (`/dashboard/messages`)
- [x] Fetch `getUserConversations(uid, 'employer')`
- [x] Display all conversations with workers
- [x] For each conversation show:
  - Worker name and avatar
  - Job title (if applicable)
  - Last message preview + timestamp
  - Unread indicator (bold name + dot if unread by employer)
- [x] Sort by: Most Recent, Unread First
- [x] Click conversation → `/dashboard/messages/{conversationId}`
- [x] Real-time updates via `subscribeToConversations()`
- [x] Empty state: "No messages yet"

### E2 — Employer Chat View (`/dashboard/messages/[conversationId]`)
- [x] Fetch `getConversation(conversationId)` + worker profile
- [x] Render `MessageThread` with:
  - Worker name and avatar at top
  - Job title if conversation has one
  - Messages displayed chronologically
- [x] Send message input (reuse existing UI)
- [x] Mark messages as seen when employer reads them
- [x] Back button → `/dashboard/messages`
- [x] Real-time message updates via `subscribeToMessages()`

### E3 — Worker Messaging (Verify Already Working)
- [x] Verify `/worker/messages` shows all conversations
- [x] Verify `/worker/messages/[id]` chat works both ways
- [x] Test: Worker messages employer → appears in real-time on employer side
- [x] Test: Employer messages worker → appears in real-time on worker side
- [x] Mark seen receipts work both directions

---

## Feature F: Firestore Security Rules & Data Model

### F1 — Update Firestore Rules
- [ ] Employers can create/read/update/delete their own profile in `employerProfiles/{uid}`
- [ ] Employers can create/update job posts in `jobPosts/{jobId}` (only their own)
- [ ] Employers can close jobs (update status field)
- [ ] Workers can read active job posts (no write permission)
- [ ] Workers cannot create job posts
- [ ] Both parties can send/read messages in shared conversations
- [ ] Both parties can update message `seenAt` field
- [ ] Prevent messages outside conversation participants

### F2 — Firestore Collections Verification
- [ ] `users/{uid}` — has role='employer' and subscriptionTier fields
- [ ] `employerProfiles/{uid}` — has company name, description, location, etc.
- [ ] `jobPosts/{jobId}` — has correct structure (title, description, requirements, location, status, employerId, postedAt)
- [ ] `conversations/{convId}` — stores employer↔worker conversations
- [ ] `pings/{pingId}` — stores worker interest in jobs
- [ ] `messages/{msgId}` in subcollection — stores actual chat messages

---

## Feature G: Dashboard Home & Navigation

### G1 — Employer Dashboard Home (`/dashboard`)
- [x] Display welcome message: "Welcome, [Employer Name]!"
- [x] Show quick stats:
  - Jobs posted (count)
  - Active conversations
  - Unread messages count
  - Pings received (this month)
- [x] Recent pings widget (last 5 workers interested)
- [x] Recent messages widget (last 5 conversations)
- [x] Quick action buttons:
  - "Post New Job" → `/dashboard/post-job`
  - "View My Jobs" → `/dashboard/my-jobs`
  - "View Messages" → `/dashboard/messages`
  - "Edit Profile" → `/dashboard/profile`

### G2 — Employer Navigation/Layout
- [x] Sidebar (desktop) / Bottom nav (mobile) with links to:
  - Home (`/dashboard`)
  - Post Job (`/dashboard/post-job`)
  - My Jobs (`/dashboard/my-jobs`)
  - Messages (`/dashboard/messages`)
  - Profile (`/dashboard/profile`)
- [x] Show user name and role badge
- [x] Logout button
- [x] Subscription tier display

### G3 — Employer Job Card Component
- [ ] Create/reuse component to display job in "My Jobs" list
- [ ] Show: title, type, location, status, posted date, ping count
- [ ] Hover/active states for interactivity
- [ ] Actions: View, Edit, Close

---

## Feature H: Worker Profile Visibility (Basic)

### H1 — Worker Profile on Employer Side (Optional MVP)
- [ ] When employer clicks worker name in conversation or ping list
- [ ] Navigate to worker profile view (read-only from employer perspective)
- [ ] Show: name, avatar, title/skills, location, rating, badge count
- [ ] No edit capability (worker controls their own profile)

---

## Verification Checklist

### End-to-End Flow: Employer Creates Job → Worker Finds & Pings → Conversation Starts

1. **Employer Setup**
  - [x] Employer signs up with role='employer'
  - [x] Redirected to `/dashboard/setup`
  - [x] Completes profile (company name, location, etc.)
  - [x] Profile saved to Firestore
  - [x] Redirected to `/dashboard` home

2. **Job Posting**
  - [x] Employer navigates to `/dashboard/post-job`
  - [x] Fills job form (title, description, requirements, location, salary)
  - [x] Submits → job created in Firestore
  - [x] Job appears in `/dashboard/my-jobs` immediately
  - [x] Toast: "Job posted successfully!"

3. **Worker Discovers Job**
  - [x] Worker navigates to `/worker/jobs`
  - [x] New employer job appears in real-time (within 1-2 seconds)
  - [x] Job is filterable by location, skills, search text
  - [x] Worker can view job details at `/worker/jobs/[id]`

4. **Worker Pings Job**
  - [x] Worker clicks "Interested" button
  - [x] `sendPing()` called, ping created in Firestore
  - [x] `getOrCreateConversation()` creates conversation
  - [x] Toast: "You've expressed interest!"
  - [x] Redirected to `/worker/messages/{conversationId}`

5. **Employer Receives Ping**
  - [x] Ping appears in `/dashboard` "Recent Pings" widget immediately
  - [x] Employer sees worker name and job title
  - [x] Conversation appears in `/dashboard/messages` list

6. **Messaging Verification**
  - [x] Worker types message in chat and sends
  - [x] Message appears in real-time on employer's screen
  - [x] Employer types reply
  - [x] Message appears in real-time on worker's screen
  - [x] Seen receipts work both ways
  - [x] Unread indicators update live

### Performance & Edge Cases
- [ ] Geospatial filtering works correctly (10-200km range)
- [ ] Multiple jobs from same employer display correctly
- [ ] Employer closes job → immediately disappears from worker board
- [ ] Duplicate pings prevented (worker can't ping same job twice)
- [ ] Conversations persist after job closes
- [ ] No data loss on page refresh
- [ ] Real-time updates don't cause duplicates or flickering

---

## Implementation Order (Recommended)

1. **Phase 1: Employer Profile**
   - Setup route, form, Firestore save
   - Profile edit page
   - Guard to enforce completion

2. **Phase 2: Job Posting**
   - Create form, validation, Firestore save
   - My Jobs list and detail view
   - Edit and close functionality

3. **Phase 3: Worker Job Board Real-Time**
   - Connect to real Firestore data
   - Real-time listener for new/updated jobs
   - Filtering and search on real data

4. **Phase 4: Pinging & Conversations**
   - Verify ping system works with real jobs
   - Test auto-conversation creation
   - Dashboard ping alerts

5. **Phase 5: Messaging Verification**
   - End-to-end chat between employer and worker
   - Real-time updates, seen receipts
   - Performance testing with multiple users

---

## Notes
- Reuse existing `MessageThread`, `EmployeeJobCard`, components where possible
- Worker-side job board already partially complete; just connect to real Firestore
- Employer dashboard/setup routes may need creation (check existing routes first)
- Geospatial queries can use client-side distance calculation if Firestore geo-queries not available
- Mock data fallback for testing without Firebase (optional)
- Plan for pagination if hundreds of jobs expected in future
- Consider indexing on `jobPosts.status`, `jobPosts.employerId`, `jobPosts.postedAt` for performance
