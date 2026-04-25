'use client';

import { cn } from '@/lib/utils';
import { BADGES, getBadge } from '@/lib/badge-config';
import type { BadgeType } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Single badge chip ────────────────────────────────────────────────────────

interface BadgeChipProps {
  type: BadgeType;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function BadgeChip({ type, count, selected, onClick, size = 'md' }: BadgeChipProps) {
  const cfg = getBadge(type);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              cfg.bgColor,
              cfg.color,
              selected
                ? 'ring-2 ring-offset-2 ring-accent scale-105 border-accent'
                : 'border-transparent',
              onClick && 'cursor-pointer hover:opacity-80 hover:scale-105',
              !onClick && 'cursor-default',
            )}
          >
            <span>{cfg.emoji}</span>
            <span>{cfg.label}</span>
            {count !== undefined && count > 0 && (
              <span className="ml-0.5 rounded-full bg-white/40 px-1.5 py-0.5 text-xs font-bold">
                {count}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{cfg.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Badge row display ────────────────────────────────────────────────────────

interface BadgeDisplayProps {
  badgeCounts: Record<BadgeType, number>;
  compact?: boolean;
}

export function BadgeDisplay({ badgeCounts, compact = false }: BadgeDisplayProps) {
  const earned = BADGES.filter((b) => badgeCounts[b.type] > 0);

  if (earned.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No badges earned yet.</p>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', compact && 'gap-1.5')}>
      {earned.map((b) => (
        <BadgeChip
          key={b.type}
          type={b.type}
          count={badgeCounts[b.type]}
          size={compact ? 'sm' : 'md'}
        />
      ))}
    </div>
  );
}

// ─── Badge picker (for review form) ──────────────────────────────────────────

interface BadgePickerProps {
  selected: BadgeType | null;
  onChange: (badge: BadgeType | null) => void;
}

export function BadgePicker({ selected, onChange }: BadgePickerProps) {
  return (
    <div>
      <p className="text-sm font-medium mb-2 text-muted-foreground">
        Award a badge <span className="font-normal">(optional)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {BADGES.map((b) => (
          <BadgeChip
            key={b.type}
            type={b.type}
            selected={selected === b.type}
            onClick={() => onChange(selected === b.type ? null : b.type)}
          />
        ))}
      </div>
    </div>
  );
}
