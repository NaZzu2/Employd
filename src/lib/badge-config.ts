import type { BadgeType } from '@/lib/types';

export type BadgeConfig = {
  type: BadgeType;
  label: string;
  emoji: string;
  description: string;
  color: string; // tailwind text color class
  bgColor: string; // tailwind bg color class
};

export const BADGES: BadgeConfig[] = [
  {
    type: 'punctual',
    label: 'Punctual',
    emoji: '⚡',
    description: 'Always on time',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
  {
    type: 'reliable',
    label: 'Reliable',
    emoji: '🛡️',
    description: 'Delivered as promised',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    type: 'quality',
    label: 'Quality Work',
    emoji: '💎',
    description: 'Exceptional quality',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    type: 'professional',
    label: 'Professional',
    emoji: '🤝',
    description: 'Outstanding professionalism',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    type: 'goes_above',
    label: 'Goes Above & Beyond',
    emoji: '🚀',
    description: 'Exceeds expectations every time',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
];

export function getBadge(type: BadgeType): BadgeConfig {
  return BADGES.find((b) => b.type === type) ?? BADGES[0];
}

export const EMPTY_BADGE_COUNTS: Record<BadgeType, number> = {
  punctual: 0,
  reliable: 0,
  quality: 0,
  professional: 0,
  goes_above: 0,
};
