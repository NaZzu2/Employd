import type { Plan } from './types';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BILLING_MODE = process.env.BILLING_MODE || 'mock';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';

// Minimal local plan definition — kept inline so this file works standalone.
export const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: 0, currency: 'EUR', monthlyThreads: 10, features: ['Basic posting'] },
  { id: 'pro', name: 'Pro', price: 29, currency: 'EUR', monthlyThreads: 50, features: ['More threads', 'Priority support'] },
  { id: 'enterprise', name: 'Enterprise', price: 199, currency: 'EUR', monthlyThreads: null, features: ['Unlimited threads', 'Account manager'] },
];

export async function getAvailablePlans(): Promise<Plan[]> {
  // In future this could read from a remote config or Firestore
  return PLANS;
}

function initAdmin() {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(sa) });
      } catch (e) {
        // fall back to default
        initializeApp();
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

export async function createCheckoutSession(userId: string | null, planId: string): Promise<{ url?: string; sessionId?: string }> {
  if (BILLING_MODE === 'mock') {
    // Return a mock URL that the client can redirect to — query indicates mock success
    return { url: `/dashboard/subscriptions?mock_success=1&plan=${encodeURIComponent(planId)}` };
  }

  // Stripe mode (requires STRIPE_SECRET_KEY)
  if (!STRIPE_KEY) throw new Error('Stripe not configured');
  // Lazy import to avoid bringing stripe into dev unless used
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2022-11-15' });
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error('Plan not found');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: { name: plan.name },
          unit_amount: Math.round(plan.price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/subscriptions?success=1&plan=${planId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/subscriptions?canceled=1`,
    metadata: { userId: userId || '', planId },
  });

  return { url: session.url ?? undefined, sessionId: session.id };
}

export async function applySubscription(userId: string, planId: string): Promise<void> {
  // Try to update via admin SDK if available (server environment). Otherwise fail gracefully.
  try {
    const db = initAdmin();
    const userRef = db.collection('users').doc(userId);
    const employerRef = db.collection('employerProfiles').doc(userId);
    await userRef.set({ subscriptionTier: planId, monthlyThreadsStarted: 0 }, { merge: true });
    await employerRef.set({ subscriptionTier: planId, updatedAt: admin.firestore.FieldValue.serverTimestamp() } as any, { merge: true });
  } catch (err) {
    // If admin updates fail (e.g., missing service account), log and rethrow to surface during server ops
    console.warn('applySubscription: admin update failed or not available', err);
    throw err;
  }
}
