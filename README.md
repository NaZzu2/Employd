# Employ'd — Workforce Hiring Platform

A mobile-first web application connecting **employers** with **workers** for short-term, project-based, and permanent roles. Employers post jobs, browse the worker pool, and manage conversations. Workers browse listings, express interest with a one-tap "Ping", and manage their profile.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | TypeScript |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Auth** | [Firebase Authentication](https://firebase.google.com/products/auth) (email/password) |
| **Database** | [Cloud Firestore](https://firebase.google.com/products/firestore) |
| **AI Features** | [Firebase Genkit](https://firebase.google.com/products/genkit) + Gemini 2.5 Flash |
| **Deployment** | [Firebase App Hosting](https://firebase.google.com/products/app-hosting) |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A **Firebase project** with Firestore and Authentication enabled
- (Optional) A **Google AI API key** for Genkit AI features

---

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd Employd
npm install
```

### 2. Configure Firebase

Create `.env.local` in the project root:

```bash
# Firebase Web SDK (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI (for Genkit / AI features — optional)
GOOGLE_GENAI_API_KEY=your_google_ai_key
```

Get these values from the [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps → Web app.

### 3. Set Up Firestore

```bash
# Log in to Firebase CLI
npx -y firebase-tools@latest login

# Deploy Firestore security rules
npx -y firebase-tools@latest deploy --only firestore:rules
```

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

> **Note:** If port 9002 is in use, run `npm run dev -- -p 9003`

---

## User Roles

### Employer
- Complete company profile at `/dashboard/setup`
- Post job listings at `/dashboard/post-job`
- Browse the worker pool at `/dashboard/workers` (radius + skill filters)
- View and respond to worker Pings at `/dashboard/pings`
- Manage conversations at `/dashboard/messages`
- Manage job listings at `/dashboard/my-jobs`

### Worker
- Complete worker profile at `/worker/my-profile`
- Browse active job listings at `/worker/jobs`
- Send a "Ping" to express interest in a job
- View conversations at `/worker/messages`

---

## Firebase Setup Requirements

### Authentication
Enable **Email/Password** sign-in:  
Firebase Console → Authentication → Sign-in method

### Firestore Database
1. Create a Firestore database in **Native mode**
2. Deploy security rules: `npx -y firebase-tools@latest deploy --only firestore:rules`

### Firestore Collections

| Collection | Description |
|-----------|-------------|
| `users` | Auth user documents (role, subscription tier, settings) |
| `employerProfiles` | Company profile details |
| `workerProfiles` | Worker profile details, skills, availability |
| `jobPosts` | Job listings posted by employers |
| `pings` | Worker interest notifications sent to employers |
| `conversations` | Messaging threads between employer and worker |
| `conversations/{id}/messages` | Individual messages within a thread |
| `contracts` | Hire agreements |
| `reviews` | Post-contract ratings and badge awards |

---

## Key Features

### Subscription Tiers
Workers and employers have `free`, `pro`, or `enterprise` tiers.

- **Free employers**: 10 conversation threads/month
- **Pro employers**: 50 threads/month
- **Enterprise**: Unlimited
- Badge award limits per review also vary by tier

### Messaging Rules
- Only **employers** can initiate new conversation threads (monthly quota enforced)
- Workers initiate contact via **Pings** — employers accept and open a thread
- Real-time message updates via Firestore `onSnapshot`

### Worker Pool Browser
- Employers browse all registered workers at `/dashboard/workers`
- Filterable by: skill tags, radius (Haversine distance), availability status
- Distance filtering requires employer location set in profile setup

### AI Features (Genkit + Gemini)
- Job recommendation flow: `src/ai/flows/ai-job-recommendations-flow.ts`
- CV auto-fill from uploaded resume: `src/ai/flows/profile-auto-fill-cv-flow.ts`
- Powered by Gemini 2.5 Flash via Google AI

---

## Docker

Run the app in production mode with Docker:

```bash
docker compose up --build
# Open http://localhost:3000
```

Firebase credentials are read from `.env.local` automatically.

---

## Deployment (Firebase App Hosting)

```bash
npx -y firebase-tools@latest apphosting:backends:create
npx -y firebase-tools@latest deploy --only apphosting
```

See `apphosting.yaml` for scaling configuration (default: `maxInstances: 1`).

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 9002 (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run genkit:dev` | Start Genkit AI dev server |
| `npm run genkit:watch` | Start Genkit with file watching |

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Employer routes
│   │   ├── workers/        # Worker pool browser
│   │   ├── my-jobs/        # Job management
│   │   ├── post-job/       # Job posting form
│   │   ├── pings/          # Incoming pings
│   │   ├── messages/       # Messaging
│   │   ├── setup/          # Employer profile setup
│   │   └── profile/        # Profile edit
│   ├── worker/             # Worker routes
│   │   ├── jobs/           # Browse jobs
│   │   ├── messages/       # Worker messaging
│   │   └── my-profile/     # Worker profile
│   └── signup/             # Registration with role selection
├── components/
│   ├── dashboard/          # Employer-facing components
│   ├── worker/             # Worker-facing components
│   ├── shared/             # Shared components (reviews, ratings, badges)
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── firebase.ts         # Firebase init + config validation
│   ├── firestore.ts        # All Firestore read/write helpers
│   ├── auth-context.tsx    # React auth context + sign in/up/out
│   ├── types.ts            # TypeScript types for all data models
│   └── utils.ts            # Haversine distance, date helpers, etc.
└── ai/
    ├── genkit.ts           # Genkit AI client (Gemini 2.5 Flash)
    └── flows/              # AI flow definitions
```

---

## Known Limitations

- **Firestore compound queries** (`where` + `orderBy` on different fields) require composite indexes that are not yet deployed. All such queries in this project sort results client-side to avoid this.
- **Radius filtering** in the worker pool requires both employer and worker to have `location` set in their profiles.
- **AI features** require a valid `GOOGLE_GENAI_API_KEY` in `.env.local`.
