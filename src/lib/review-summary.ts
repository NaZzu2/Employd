import { EMPTY_BADGE_COUNTS } from '@/lib/badge-config';
import type { BadgeType, Review } from '@/lib/types';

export type ReviewSummary = {
  averageRating: number;
  reviewCount: number;
  badgeCounts: Record<BadgeType, number>;
};

export function summarizeReviews(reviews: readonly Review[]): ReviewSummary {
  const badgeCounts = { ...EMPTY_BADGE_COUNTS };
  let starsTotal = 0;

  for (const review of reviews) {
    starsTotal += review.stars;
    const awardedBadges = review.badges?.length
      ? review.badges
      : review.badge
        ? [review.badge]
        : [];

    for (const badge of new Set(awardedBadges)) {
      badgeCounts[badge] += 1;
    }
  }

  return {
    averageRating: reviews.length === 0 ? 0 : starsTotal / reviews.length,
    reviewCount: reviews.length,
    badgeCounts,
  };
}