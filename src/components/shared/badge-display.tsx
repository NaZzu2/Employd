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
import { Lock } from 'lucide-react';
import { UpgradePrompt } from '@/components/shared/upgrade-prompt';

// ─── Single badge chip ────────────────────────────────────────────────────────

interface BadgeChipProps {
  type: BadgeType;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function BadgeChip({ type, count, selected, onClick, size = 'md', className }: BadgeChipProps) {
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
              className
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
  selected?: BadgeType | null;
  onChange?: (badge: BadgeType | null) => void;
  selectedBadges?: BadgeType[];
  onChangeBadges?: (badges: BadgeType[]) => void;
  maxBadges?: number;
}

export function BadgePicker({
  selected,
  onChange,
  selectedBadges = [],
  onChangeBadges,
  maxBadges = 1,
}: BadgePickerProps) {
  // Normalize the active selected array
  const activeSelected = onChangeBadges
    ? selectedBadges
    : (selected ? [selected] : []);

  const limitReached = activeSelected.length >= maxBadges;

  const handleToggle = (type: BadgeType) => {
    let newSelection: BadgeType[] = [];
    if (activeSelected.includes(type)) {
      newSelection = activeSelected.filter((b) => b !== type);
    } else {
      if (maxBadges === 1) {
        newSelection = [type];
      } else if (activeSelected.length < maxBadges) {
        newSelection = [...activeSelected, type];
      } else {
        return; // limit reached
      }
    }

    if (onChangeBadges) {
      onChangeBadges(newSelection);
    } else if (onChange) {
      onChange(newSelection[0] || null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          Award a badge <span className="font-normal">(optional)</span>
        </p>
        {maxBadges === 1 ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
            1 badge per review (free plan)
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {activeSelected.length} of {maxBadges} badges selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {BADGES.map((b) => {
          const isSelected = activeSelected.includes(b.type);
          // If maxBadges === 1, clicking switches, so it's not locked.
          // If maxBadges > 1, unselected badges are locked when selection is full.
          const isLocked = !isSelected && limitReached && maxBadges > 1;

          return (
            <div key={b.type} className="relative">
              <BadgeChip
                type={b.type}
                selected={isSelected}
                onClick={isLocked ? undefined : () => handleToggle(b.type)}
                className={cn(isLocked && 'opacity-40 cursor-not-allowed')}
              />
              {isLocked && (
                <span className="absolute -top-1 -right-1 bg-background border rounded-full p-0.5 shadow-sm">
                  <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {limitReached && (
        <div className="pt-1">
          <UpgradePrompt reason="more_badges" compact />
        </div>
      )}
    </div>
  );
}
