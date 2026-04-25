'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StarRating } from '@/lib/types';

interface StarRatingInputProps {
  value: StarRating | 0;
  onChange?: (value: StarRating) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' };

export function StarRatingInput({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingInputProps) {
  const stars = [1, 2, 3, 4, 5] as const;

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-transform',
            !readOnly && 'hover:scale-110 cursor-pointer',
            readOnly && 'cursor-default',
          )}
          aria-label={readOnly ? `${star} stars` : `Rate ${star} stars`}
        >
          <Star
            className={cn(
              sizes[size],
              'transition-colors',
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Compact read-only display with average */
export function StarRatingDisplay({
  average,
  count,
  size = 'sm',
}: {
  average: number;
  count: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex items-center gap-1.5">
      <StarRatingInput value={Math.round(average) as StarRating | 0} readOnly size={size} />
      <span className="text-sm text-muted-foreground">
        {average > 0 ? average.toFixed(1) : '—'}
        {count > 0 && <span className="ml-1">({count})</span>}
      </span>
    </div>
  );
}
