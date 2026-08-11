import { NextResponse } from 'next/server';
import { applySubscription } from '@/lib/billing';

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, planId } = body as { userId?: string; planId?: string };
  if (!userId || !planId) return NextResponse.json({ error: 'userId and planId required' }, { status: 400 });
  try {
    await applySubscription(userId, planId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
