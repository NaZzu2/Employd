# Employ'd — Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it `employd` (or similar)
4. Disable Google Analytics (optional) → **Create project**

---

## Step 2: Enable Authentication

1. In your Firebase project → **Build → Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** → Save

---

## Step 3: Create a Firestore Database

1. **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **Start in production mode** (rules already provided)
4. Select a region close to your Azure deployment (e.g. `europe-west` for Europe)
5. Click **Done**

---

## Step 4: Upload Security Rules

1. In Firestore → **Rules** tab
2. Copy the contents of `firestore.rules` from this repo
3. Paste and click **Publish**

---

## Step 5: Get Your Firebase Config

1. **Project Settings** (gear icon) → **Your apps**
2. Click **"</> Web"** → register app (name it `employd-web`)
3. Copy the `firebaseConfig` object shown

---

## Step 6: Set Environment Variables

Create a `.env.local` file in the project root (copy from `.env.local.example`):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=employd-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=employd-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=employd-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
GEMINI_API_KEY=your-gemini-key-here
```

---

## Step 7: Run the App

```bash
npm run dev
```

The app will be available at http://localhost:9002

---

## Azure Deployment (later)

The `Dockerfile` is already configured. For Azure Container Apps:

```bash
# Build the Docker image
docker build -t employd .

# Push to Azure Container Registry
az acr build --registry <your-registry> --image employd:latest .

# Deploy to Azure Container Apps
az containerapp create \
  --name employd \
  --resource-group <your-rg> \
  --environment <your-env> \
  --image <your-registry>.azurecr.io/employd:latest \
  --env-vars NEXT_PUBLIC_FIREBASE_API_KEY=... \
             NEXT_PUBLIC_FIREBASE_PROJECT_ID=... \
             ... \
  --target-port 3000 \
  --ingress external
```

> **Note:** Firebase config values that start with `NEXT_PUBLIC_` are baked into the client bundle at build time. You'll need to provide them as build args when building the Docker image for Azure, or using Azure Container Apps environment variables with the `--build-arg` flag.

---

## Firestore Composite Indexes

Some queries require composite indexes. Firebase will log a direct URL to create them when
you first run a query that needs one. Common ones needed:

| Collection | Fields | Order |
|---|---|---|
| `workerProfiles` | `isLookingForWork DESC`, `averageRating DESC` | |
| `jobPosts` | `status ASC`, `postedAt DESC` | |
| `pings` | `employerId ASC`, `createdAt DESC` | |
| `conversations` | `employerId ASC`, `lastMessageAt DESC` | |
| `conversations` | `workerId ASC`, `lastMessageAt DESC` | |

Click the URL in the Firebase error to auto-create each index.
