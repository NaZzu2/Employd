import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Haversine Distance ───────────────────────────────────────────────────────

/**
 * Returns the distance in kilometres between two lat/lng coordinates
 * using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Returns true if point B is within radiusKm of point A */
export function isWithinRange(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
  radiusKm: number,
): boolean {
  return haversineDistanceKm(aLat, aLng, bLat, bLng) <= radiusKm;
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

import type { SubscriptionTier } from '@/lib/types';
import { THREAD_LIMITS } from '@/lib/types';

export function canStartThread(
  tier: SubscriptionTier,
  used: number,
): boolean {
  return used < THREAD_LIMITS[tier];
}

export function threadsRemaining(
  tier: SubscriptionTier,
  used: number,
): number | 'unlimited' {
  const limit = THREAD_LIMITS[tier];
  if (limit === Infinity) return 'unlimited';
  return Math.max(0, limit - used);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Reset helpers ────────────────────────────────────────────────────────────

/** True if the monthly thread counter needs resetting */
export function shouldResetMonthlyThreads(resetAtIso: string): boolean {
  const resetAt = new Date(resetAtIso);
  const now = new Date();
  return now.getFullYear() > resetAt.getFullYear() ||
    now.getMonth() > resetAt.getMonth();
}
