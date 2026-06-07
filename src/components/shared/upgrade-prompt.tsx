'use client';

import { Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type UpgradeReason = 'more_chats' | 'more_badges';

interface UpgradePromptProps {
  reason: UpgradeReason;
  /** Compact mode renders an inline inline hint instead of a full card */
  compact?: boolean;
}

const COPY: Record<UpgradeReason, { icon: typeof Zap; title: string; description: string }> = {
  more_chats: {
    icon: Zap,
    title: 'Unlock more conversations',
    description: 'Upgrade to Pro to start up to 50 conversations per month, or go unlimited with Enterprise.',
  },
  more_badges: {
    icon: Award,
    title: 'Unlock more badge awards',
    description: 'Upgrade to Pro to award up to 3 badges per review and recognise exceptional work more meaningfully.',
  },
};

export function UpgradePrompt({ reason, compact = false }: UpgradePromptProps) {
  const { icon: Icon, title, description } = COPY[reason];

  if (compact) {
    return (
      <p className="text-xs text-orange-500 flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0" />
        {title} —{' '}
        <button
          type="button"
          className="underline underline-offset-2 font-medium cursor-not-allowed opacity-70"
          title="Subscription management coming soon"
        >
          Upgrade your plan
        </button>
      </p>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 flex gap-3 items-start',
    )}>
      <div className="rounded-full bg-orange-500/10 p-1.5 shrink-0">
        <Icon className="h-4 w-4 text-orange-500" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-orange-500/40 text-orange-600 hover:bg-orange-500/10 cursor-not-allowed"
        title="Subscription management coming soon"
        disabled
      >
        Upgrade
      </Button>
    </div>
  );
}
