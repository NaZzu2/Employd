import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { applySubscription } from '@/lib/billing';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' }) : null;

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') || '';
  const body = await req.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) return NextResponse.json({ error: 'stripe not configured' }, { status: 500 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'invalid webhook signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (userId && planId) {
      try {
        await applySubscription(userId, planId);
      } catch (err) {
        console.error('applySubscription webhook error', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
