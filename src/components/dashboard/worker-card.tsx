'use client';

import Link from 'next/link';
import { MapPin, Briefcase, Star, Zap, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { StarRatingDisplay } from '@/components/shared/star-rating';
import { BadgeDisplay } from '@/components/shared/badge-display';
import { cn } from '@/lib/utils';
import type { WorkerProfile } from '@/lib/types';

interface WorkerCardProps {
  worker: WorkerProfile;
  distanceKm?: number;
  onStartConversation?: (worker: WorkerProfile) => void;
  onMarkHired?: (worker: WorkerProfile) => void;
}

export function WorkerCard({
  worker,
  distanceKm,
  onStartConversation,
  onMarkHired,
}: WorkerCardProps) {
  return (
    <Card
      className={cn(
        'flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1',
        worker.isLookingForWork && 'ring-1 ring-accent/40',
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/20">
            <AvatarImage src={worker.avatarUrl} alt={worker.displayName} />
            <AvatarFallback className="text-base font-semibold">
              {worker.displayName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base leading-tight truncate">
                {worker.displayName}
              </h3>
              {worker.isLookingForWork && (
                <Badge className="bg-accent/15 text-accent border-accent/30 text-xs shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{worker.title || 'Worker'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-2">
          <StarRatingDisplay average={worker.averageRating} count={worker.reviewCount} />
          {worker.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{worker.location.address}</span>
              {distanceKm !== undefined && (
                <span className="ml-1 text-accent font-medium">· {distanceKm.toFixed(0)} km</span>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* Summary */}
        {worker.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">{worker.summary}</p>
        )}

        {/* Skills */}
        {worker.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {worker.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {worker.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{worker.skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Badges */}
        <BadgeDisplay badgeCounts={worker.badgeCounts} compact />
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onStartConversation?.(worker)}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Message
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => onMarkHired?.(worker)}
        >
          <Briefcase className="h-3.5 w-3.5 mr-1.5" />
          Mark as Hired
        </Button>
      </CardFooter>
    </Card>
  );
}
