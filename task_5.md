# Employ'd — Task 5: Enhanced Job Management & Employer Features

## Overview
Complete missing job management features from Task 4, including job detail pages, editing, closing jobs, viewing interested workers, and improved UI for job discovery.

---

## Feature A: Complete Job Detail & Management Pages

### A1 — Job Detail View (`/dashboard/my-jobs/[id]`)
- [ ] Display all job details (title, type, location, salary, description, requirements)
- [ ] Show job posting date and current status badge
- [ ] Display view count (how many workers have viewed this job)
- [ ] Show list of workers who pinged this job with:
  - Worker name, title, avatar
  - Time of ping
  - "Message" button to start conversation
  - "Hire" button to send contract offer
- [ ] Show recent conversations related to this job
- [ ] Display action buttons: "Edit Job", "Close Job", "Message Interested Workers"
- [ ] Add breadcrumb navigation

### A2 — Edit Job Page (`/dashboard/my-jobs/[id]/edit`)
- [ ] Pre-populate form with existing job data
- [ ] Allow editing: title, type, location, salary, description, requirements
- [ ] Prevent editing of `jobType` (keep it locked)
- [ ] "Save" button calls `updateJobPost(jobId, changes)`
- [ ] Success toast: "Job updated successfully!"
- [ ] Cancel button returns to job detail without saving
- [ ] Validation on all required fields

### A3 — Close Job Dialog
- [ ] Add "Close Job" button with confirmation modal
- [ ] Modal text: "Close this job posting? It will no longer be visible to workers, but existing conversations remain active."
- [ ] Two buttons: "Cancel" and "Confirm Close"
- [ ] On confirm: call `updateJobPostStatus(jobId, 'closed')`
- [ ] Success toast: "Job closed successfully"
- [ ] Redirect back to `/dashboard/my-jobs` after closing
- [ ] Closed jobs should appear in a separate "Closed" tab on My Jobs page

---

## Feature B: Improved My Jobs List

### B1 — Job List Enhancements (`/dashboard/my-jobs`)
- [ ] Add tabs: "Active" and "Closed" (filter by status)
- [ ] For each job card, display:
  - Job title, type, location
  - Posted date
  - Status badge (Active/Closed)
  - **Number of pings received** (count from pings collection)
  - **Number of active conversations** (count from conversations collection)
  - Pay rate
- [ ] "Sort by" dropdown options:
  - Most Recent
  - Most Pings
  - Most Conversations
  - Status (Active first)
- [ ] Click on a job card → navigate to `/dashboard/my-jobs/[id]`
- [ ] "Edit" button on each card → `/dashboard/my-jobs/[id]/edit`
- [ ] "Close" button on each card → shows close confirmation modal
- [ ] Pagination if > 10 jobs

### B2 — Firestore Helpers for Job Stats
- [ ] Add `getJobPingCount(jobId)` — returns number of pings for a job
- [ ] Add `getJobConversationCount(jobId)` — returns number of conversations linked to a job
- [ ] Both should be efficiently queried (use where clauses, not full collections)

### B3 — Empty State
- [ ] If no jobs exist: "You haven't posted any jobs yet"
- [ ] Button: "Post Your First Job" → `/dashboard/post-job`

---

## Feature C: Interested Workers View

### C1 — View Interested Workers (`/dashboard/my-jobs/[id]/interested`)
- [ ] Create new route: `/dashboard/my-jobs/[id]/interested`
- [ ] Display list of all workers who pinged this job
- [ ] For each worker ping, show:
  - Worker avatar, name, title
  - Worker skills (from workerProfile)
  - Worker rating and review count
  - Ping message (the message they sent)
  - Time of ping
  - Status badge (Pending/Accepted/Declined)
  - Actions:
    - "View Profile" → link to worker profile
    - "Message" → start/navigate to conversation
    - "Hire" → send contract offer (Task 6)
- [ ] Sorting options: Most Recent, Highest Rated, Status

### C2 — Link from Job Detail
- [ ] On job detail page (`/dashboard/my-jobs/[id]`), add "View All Interested Workers" button
- [ ] Displays count: "5 workers interested" (clickable badge)
- [ ] Navigates to `/dashboard/my-jobs/[id]/interested`

---

## Feature D: Worker Job Card Enhancements

### D1 — Improve Worker Job Card UI (`/src/components/worker/employee-job-card.tsx`)
- [ ] Display:
  - Company name & logo/avatar
  - Job title (prominent)
  - Job type badge (Full-time/Part-time/Contract)
  - Location with distance (if possible)
  - Salary/pay range
  - 2-3 key requirements (truncated with "...more")
  - Posted date (e.g., "Posted 2 days ago")
- [ ] Action buttons:
  - "Interested" → opens PingDialog
  - "Save" → add to saved jobs (future feature)
- [ ] Hover effect / card shadow on interaction
- [ ] Responsive on mobile

### D2 — Job Feed Filtering & Sorting (`/worker/jobs`)
- [ ] Add search bar at top
- [ ] Filter options (drawer/sidebar on mobile):
  - Job type (Full-time, Part-time, Contract) — checkboxes
  - Pay range (slider or min/max inputs)
  - Distance radius (if user location is set) — slider
  - Skills match (show jobs matching user's skills)
- [ ] Sort options:
  - Most Recent
  - Closest to me
  - Best pay
  - Most relevant (skills match)
- [ ] Pagination or infinite scroll

---

## Feature E: Job View Tracking (Optional but Recommended)

### E1 — Track Job Views
- [ ] Create `jobViews` collection: `jobViews/{id}` with:
  - `jobId`, `workerId`, `viewedAt` (timestamp)
- [ ] When a worker views a job detail page, log the view
- [ ] Use `getJobViewCount(jobId)` to display view count on job detail

### E2 — Display View Count
- [ ] Show "👁️ 23 people have viewed this job" on job detail page
- [ ] Show on employer's job list as well

---

## Feature F: Bug Fixes & Improvements

### F1 — Employer Profile Requirement
- [ ] Enforce: employers without a profile cannot post jobs
- [ ] On `/dashboard/post-job`, check if `employerProfiles/{uid}` exists
- [ ] If missing, show modal: "Please complete your profile before posting jobs"
- [ ] Button: "Go to Profile Setup" → `/dashboard/setup`
- [ ] Prevent form submission until profile exists

### F2 — Error Handling Improvements
- [ ] Ensure all Firestore errors are caught and displayed to user
- [ ] Add error toast with specific messages (e.g., "Permission denied" vs "Network error")
- [ ] Add retry buttons for failed operations

### F3 — Loading States
- [ ] Show skeleton loaders while fetching job list
- [ ] Show spinner on "Close Job" confirmation button
- [ ] Show skeleton on interested workers page while loading

---

## Verification Checklist
- [ ] Employer posts job → job appears in "My Jobs" list with ping/conversation counts
- [ ] Employer edits job → changes saved, updated date shows
- [ ] Employer closes job → job moves to "Closed" tab, no longer visible to workers
- [ ] Employer views interested workers → all pings shown with worker info
- [ ] Worker views job → can see all details, can ping
- [ ] Worker can filter/sort jobs by type, pay, distance
- [ ] Employer without profile cannot post (redirected to setup)
- [ ] All operations show proper loading states and error messages
