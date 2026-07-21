# Task 6: Worker Pool Browser for Employers

## Feature Overview
Add a dedicated "Find Workers" section where employers can browse the available worker pool with radius and category (skills/industry) filters, and initiate contact directly.

---

## Checklist

### A. Firestore Helper
- [x] A1. Add `getWorkersLookingForWork()` helper in `firestore.ts` — fetches all workerProfiles where `isLookingForWork === true`

### B. Worker Pool Page (`/dashboard/workers`)
- [x] B1. Create `src/app/dashboard/workers/page.tsx` with full worker pool browser
- [x] B2. Implement skill/category filter (multi-select chips from the worker pool's unique skills)
- [x] B3. Implement radius filter (slider: 10 / 25 / 50 / 100 / 250 km) that filters by `GeoLocation` distance from employer profile location
- [x] B4. Implement "Looking for work" toggle filter (default ON)
- [x] B5. Show worker count and "No workers found" empty state
- [x] B6. Reuse existing `WorkerCard` component to display each worker
- [x] B7. Wire up "Start Conversation" button on WorkerCard to `startConversation()` (employer-initiated — allowed by security rules)

### C. Dashboard Sidebar
- [x] C1. Add "Find Workers" nav item (`/dashboard/workers`) with `Users` icon to `dashboard-sidebar.tsx`

### D. Dashboard Home Widget
- [x] D1. Add a "Worker Pool" summary card to `dashboard/page.tsx` showing available worker count with a link to `/dashboard/workers`

### E. Utilities
- [x] E1. Add `haversineDistanceKm(lat1, lng1, lat2, lng2)` distance helper to `lib/utils.ts`
