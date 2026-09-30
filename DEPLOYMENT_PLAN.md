# Employ'd Deployment Plan

## Goal

Deploy the current Next.js application to a public HTTPS URL that works in desktop and mobile browsers, uses Firebase Authentication and Firestore in production, and retains live updates for supported workflows. Later, after upgrading the Firebase project to Blaze, deploy the existing review aggregation function and remove the temporary client-side aggregation path.

This plan is for browser access. A PWA or native mobile package is not required for the initial release.

## Current State

- The app is Next.js 15 with dynamic `/dashboard/*`, `/worker/*`, and `/api/*` routes. Firebase App Hosting is the intended host; the existing Docker setup is not the Firebase App Hosting configuration.
- Firebase web SDK setup is in `src/lib/firebase.ts`. Firebase Auth and Firestore configuration values are expected as `NEXT_PUBLIC_FIREBASE_*` variables.
- `firebase.json` points to the default Firestore database in `europe-north1`, includes Firestore rules/indexes, and declares Python 3.12 Cloud Functions from `functions/`.
- `apphosting.yaml` currently only sets `maxInstances: 1`. There is no App Hosting backend configuration in `firebase.json` and no checked-in GitHub Actions workflow.
- `functions/main.py` defines `aggregate_review`, a Firestore trigger that writes ratings, review totals, and badge counts to the recipient's `users` and role-specific profile documents. A prior `firebase deploy --only functions` attempt exited unsuccessfully; its detailed error is not recorded here, and the function must not be assumed deployed.
- Until that trigger is deployed, review stats are computed from review documents by `src/lib/review-summary.ts` and the profile-reading helpers in `src/lib/firestore.ts`. This is a temporary read-time fallback; it adds Firestore reads, especially when browsing worker lists.
- Temporary/demo behavior also exists: `BILLING_MODE` defaults to `mock`, authentication can construct demo users when Firebase config is missing, and some screens use mock worker/job/message data when Firebase is not configured.
- `next.config.ts` currently suppresses TypeScript and ESLint failures during `next build`. Run those checks separately until the suppression is removed.
- A root `serviceAccountKey.json` exists and is not covered by `.gitignore`. Treat it as a credential: do not inspect or publish its contents.
- Billing endpoints exist, but `/api/billing/apply` accepts a caller-supplied `userId`, and checkout accepts a user ID from the request body. They are not ready to expose publicly without server-side authentication and authorization.
- The worker app is responsive and has bottom navigation. Real-time listeners exist for messages, conversations, contracts, and active jobs. Review summaries and some profile reads are currently one-time fetches, not live listeners.
- Latest checks recorded for this workspace: `npm run typecheck` and `npm run build` passed. ESLint reported warnings but no errors. Build-level lint/type checks are currently skipped by `next.config.ts`.

## Phase 1: Release Readiness and Security

Do not expose a public deployment until all items in this phase are complete.

- [ ] Choose the production Firebase project and confirm its Firestore database is the intended Native-mode database in `europe-north1`.
- [ ] Confirm the account owner can attach a billing account and upgrade the project to Blaze. Firebase App Hosting and Cloud Functions deployment require billing to be enabled.
- [ ] Set budget alerts and review App Hosting/Cloud Functions/Firestore usage monitoring. Budget alerts notify; they are not a hard spending cap.
- [ ] Check whether `serviceAccountKey.json` is tracked in Git or has ever been pushed. If exposed, revoke/rotate that service-account key. Add the file to `.gitignore`, remove it from version control if applicable, and use the App Hosting service identity/Application Default Credentials instead of shipping a key file.
- [ ] Secure or disable billing routes before public deployment. Verify the Firebase ID token on server-side requests, derive the caller UID from that token instead of accepting arbitrary `userId`, enforce employer role/plan rules, and make mock plan application unavailable in production.
- [ ] Decide whether paid subscriptions are in scope for the first public release. If yes, define whether plans are one-time payments or recurring subscriptions. The current Stripe Checkout code uses `mode: 'payment'`, while the mock flow can grant a tier without payment; do not present either as production billing until authorization, webhook handling, and entitlement updates are verified.
- [ ] Review Firestore security rules for production access. In particular, `reviews` currently allows any signed-in user to read review documents; confirm that this matches the intended privacy policy.
- [ ] Review messaging abuse controls. The 2,000-character limit is enforced in Firestore rules, but the five-second sender throttle is client-side and can be bypassed. Decide whether to add a trusted server-side throttle before opening signups broadly.
- [ ] Remove `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` from `next.config.ts`, then make typecheck and lint required release gates. Fix warnings that indicate real defects; do not rely on `next build` alone while these options are present.
- [ ] Capture the full output from the prior failed Functions deployment and resolve the cause after Blaze is enabled. Confirm the deployed trigger in the Firebase console/CLI.

**Gate:** Production credentials are protected, public API endpoints are authorized, Firestore rules have been reviewed, and CI/build checks fail on actual type or lint errors.

## Phase 2: Firebase Production Configuration

- [ ] Enable Email/Password sign-in in Firebase Authentication.
- [ ] Add the eventual production domain to Firebase Authentication's authorized domains. Also verify the App Hosting-provided domain during staging.
- [ ] Confirm the Firestore database, location, rules, and indexes are correct for the selected production project. Deploy the repository's rules and indexes only after emulator tests pass:

  ```powershell
  npx -y firebase-tools@latest use <project-id>
  npm run test:rules
  npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes
  ```

- [ ] Check query errors in staging and add any missing composite indexes to `firestore.indexes.json`; redeploy indexes after emulator/production validation.
- [ ] Use separate Firebase projects for staging and production if possible. Never use production user data for emulator or seed-data tests.

## Phase 3: App Hosting Setup and Secrets

- [ ] Create a Firebase App Hosting backend for this Next.js repository, connected to the intended GitHub repository/branch or deployed through the Firebase CLI. Use a supported region close to `europe-north1` when available.
- [ ] Add the App Hosting backend configuration required by the selected deployment workflow. The repository currently has an `apphosting.yaml`, but it only sets `runConfig.maxInstances`.
- [ ] Configure `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` for the App Hosting build. These public Firebase web config values must be available during the build because Next.js embeds `NEXT_PUBLIC_*` values into browser bundles.
- [ ] Store private values in Secret Manager and grant access only to the App Hosting service identity. Never commit them or put them in client-visible `NEXT_PUBLIC_*` variables.
- [ ] Resolve the AI key naming mismatch: `.env.local.example` and `docs/FIREBASE_SETUP.md` use `GEMINI_API_KEY`, while `README.md` documents `GOOGLE_GENAI_API_KEY`. Confirm the Genkit plugin's expected variable, standardize the name, and configure it as an App Hosting secret if AI features are enabled.
- [ ] If Stripe billing is included, store `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as secrets; configure `BILLING_MODE=stripe` and the canonical HTTPS base URL. Keep Stripe test keys for staging and production keys out of local/demo configuration.
- [ ] Configure the App Hosting service identity with only the server-side Firestore permissions needed by Admin SDK routes. Prefer its attached Google service identity over `FIREBASE_SERVICE_ACCOUNT` JSON.
- [ ] Review `runConfig.maxInstances: 1` against expected traffic and cost. Keep a conservative limit for the pilot and adjust only after monitoring.

## Phase 4: Deploy and Verify Staging

- [ ] Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:rules`, and `npm run build` in a clean environment. Add a normal unit-test script and focused tests for billing/review aggregation before making them required CI gates.
- [ ] Add a GitHub Actions workflow for pull requests and deployment branches. Require the release checks before merging/deploying.
- [ ] Deploy Firestore rules/indexes and any required Cloud Functions before App Hosting rollout.
- [ ] Deploy the App Hosting backend. Confirm the managed HTTPS URL loads the login page and every required environment variable is available to the correct build/runtime phase.
- [ ] Test sign-up, sign-in, sign-out, employer setup, worker profile setup, job posting/browsing, pings, conversation creation, live messaging, contracts, reviews, and role-based access with separate employer and worker test accounts.
- [ ] Confirm real-time paths in two browser sessions: messages, conversation previews, contracts, and active jobs. Decide whether review totals must update without a reload; if so, subscribe to the relevant profile document after the Cloud Function writes its aggregate fields.
- [ ] Test the worker and employer surfaces at narrow phone widths and desktop widths in current Chrome, Safari, and Firefox. Verify navigation, forms, dialogs, keyboard behavior, and no horizontal overflow. Home-screen installation can be a later PWA task.
- [ ] Exercise failure paths: invalid credentials, missing required profile, denied Firestore writes, expired/invalid billing webhook signatures, unavailable AI key, and network interruption.
- [ ] Confirm no mock profiles/messages/authentication or mock subscription upgrades appear when using the production Firebase project.

**Gate:** A staging URL is usable over HTTPS from a computer and phone browser, and the core employer/worker workflows pass using real Firebase accounts and Firestore data.

## Phase 5: Deploy Review Aggregation on Blaze

The repository already contains the Python trigger. This phase replaces the temporary client-side Spark workaround; do it only after the function is deployed, verified, and existing reviews are backfilled.

- [ ] Confirm Blaze is enabled, required Google Cloud APIs are available, and the Firebase CLI is logged into the intended project.
- [ ] Review `functions/main.py` and test the trigger against emulator data. Confirm it only creates aggregates from valid new reviews and updates both `users/{uid}` and the correct `workerProfiles/{uid}` or `employerProfiles/{uid}` document.
- [ ] Validate trigger retries/idempotency and failure logging. The current trigger rereads all reviews for the recipient after each new review; monitor read costs and plan an incremental or counter-based implementation if volume grows.
- [ ] Deploy the Python 3.12 function from the configured `functions/` source. Verify the deployed region is `europe-north1`, the trigger is enabled, and a new test review updates the recipient's documents.
- [ ] Add a one-time trusted Admin SDK backfill for recipients with reviews created before the trigger was deployed. The create trigger will not automatically process old reviews. Verify the backfilled rating, count, and each badge count against the underlying review documents.
- [ ] Test updates for both cases: employer reviews worker, and worker reviews employer. Confirm duplicate review submissions remain blocked by Firestore rules and the trigger produces no double counting on retries.
- [ ] Only after backfill and live trigger verification, switch UI reads from review documents to the persisted aggregate fields. Remove the temporary `summarizeReviews` path and `withReviewSummary`/`withReviewSummaries` query helpers from `src/lib/review-summary.ts` and `src/lib/firestore.ts`; stop calculating review-page totals from fetched review arrays where cached totals are authoritative.
- [ ] Keep the reviews themselves loaded for the received-review history tab. Do not remove review documents or loosen the profile aggregate write protections in Firestore rules; Admin SDK writes bypass client rules.
- [ ] Deploy the UI change after verifying aggregate fields are populated for existing accounts. Keep the read-time implementation available in staging until the new persisted path is confirmed.

**Gate:** New and existing reviews produce correct aggregates for both roles, and production UI uses the deployed function-maintained fields rather than the Spark-era read-time aggregation.

## Phase 6: Disable Temporary/Mock Production Paths

Keep useful local development fixtures if desired, but ensure they cannot silently activate in a deployed production environment.

- [ ] Make missing/invalid Firebase configuration a production startup or deployment failure instead of allowing demo authentication. Keep demo auth limited to explicit local development mode.
- [ ] Ensure mock worker/job/message data is selected only by an explicit development flag, never by a production Firebase configuration error.
- [ ] Set `BILLING_MODE=stripe` only after the Stripe flow is secured and verified. Otherwise disable subscription changes in production; do not leave the mock endpoint capable of granting paid tiers.
- [ ] After Phase 5 succeeds, remove the Spark-era review-stat fallback: the client-side review summarizer and extra review queries used to decorate profile/list results. Verify all relevant profile cards and both review pages read the persisted aggregates.
- [ ] Remove obsolete environment-variable names, stale setup instructions, and temporary deployment notes from `.env.local.example`, `README.md`, `docs/FIREBASE_SETUP.md`, and `src/app/dashboard/subscriptions/README.md`.
- [ ] Verify production logs contain no credentials, private review data, or user tokens.

## Phase 7: Domain, Monitoring, and Launch

- [ ] Map the chosen custom domain to the App Hosting backend and wait for managed TLS/HTTPS provisioning.
- [ ] Add the custom domain to Firebase Authentication authorized domains and test login/logout from that domain on both desktop and mobile networks.
- [ ] Confirm email/password account recovery, support contact, privacy policy, terms, and data-retention expectations are ready before public signups.
- [ ] Set up alerts/monitoring for App Hosting rollout failures, Cloud Function errors, Firestore usage, Authentication errors, and billing webhook failures.
- [ ] Make a staging backup/export plan for Firestore and document rollback steps for App Hosting and Functions.
- [ ] Start with invited pilot users; monitor errors and quota/usage dashboards before opening general registration.

## Deployment Order

1. Phase 1 security and release gates.
2. Phase 2 Firebase production configuration.
3. Phase 3 App Hosting backend and secrets.
4. Phase 4 staging deployment and end-to-end browser verification.
5. Phase 5 Blaze review aggregation deployment and existing-data backfill.
6. Phase 6 disable production mock/Spark fallback paths after verified replacements.
7. Phase 7 custom domain, monitoring, and pilot launch.

## Not Required for Browser Launch

- A native iOS/Android package.
- A PWA manifest/service worker, unless home-screen installation or offline behavior is a launch requirement.
- Stripe live mode, if paid subscriptions are intentionally deferred. In that case, disable mock tier upgrades on the public deployment rather than exposing the mock billing path.
