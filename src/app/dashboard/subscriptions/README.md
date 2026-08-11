# Billing / Subscriptions (MVP)

- `BILLING_MODE` env: 'mock' (default) | 'stripe'
- For mock mode, selecting a plan applies subscription immediately (server will update users/employerProfiles via admin SDK if available).
- For Stripe mode, set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `NEXT_PUBLIC_BASE_URL`.
- API endpoints:
  - `GET /api/billing/plans`
  - `POST /api/billing/create-checkout { planId, userId? }`
  - `POST /api/billing/apply { planId, userId }`
  - `POST /api/billing/webhook` (Stripe webhook)
