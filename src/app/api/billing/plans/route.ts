import { NextResponse } from 'next/server';
import { getAvailablePlans } from '@/lib/billing';

export async function GET() {
  const plans = await getAvailablePlans();
  return NextResponse.json({ plans });
}
