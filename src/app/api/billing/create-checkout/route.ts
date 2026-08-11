import { NextResponse } from 'next/server';
import { createCheckoutSession, applySubscription } from '@/lib/billing';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();
  const planId = body.planId as string;
  const userId = body.userId || cookies().get('userId')?.value || null;
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

  const session = await createCheckoutSession(userId, planId);
  // If mock mode, createCheckoutSession returns a mock url; apply subscription immediately for mock
  if (session.url && process.env.BILLING_MODE === 'mock' && userId) {
    try {
      await applySubscription(userId, planId);
      return NextResponse.json({ url: session.url, success: true });
    } catch (err) {
      return NextResponse.json({ url: session.url, success: false, error: String(err) });
    }
  }

  return NextResponse.json(session);
}
