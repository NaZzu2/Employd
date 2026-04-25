'use client';

import { useState } from 'react';
import { MapPin, DollarSign, Clock, Briefcase, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PingDialog } from '@/components/worker/ping-dialog';
import { timeAgo } from '@/lib/utils';
import type { JobPost } from '@/lib/types';
import { cn } from '@/lib/utils';

interface JobFeedCardProps {
  job: JobPost;
  distanceKm?: number;
}

const typeColors: Record<string, string> = {
  'Full-time': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
  'Part-time': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300',
  Contract: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300',
};

export function JobFeedCard({ job, distanceKm }: JobFeedCardProps) {
  const [pingOpen, setPingOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card
        className="transition-all active:scale-[0.98] cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-tight">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.companyName}</p>
            </div>
            <Badge
              variant="outline"
              className={cn('text-xs shrink-0', typeColors[job.type])}
            >
              {job.type}
            </Badge>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location.address}
              {distanceKm !== undefined && (
                <span className="ml-0.5 text-accent font-medium">({distanceKm.toFixed(0)} km)</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {job.salary}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {timeAgo(job.postedAt)}
            </span>
          </div>

          {/* Description preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

          {/* Ping button */}
          <Button
            className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 mt-1"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPingOpen(true);
            }}
          >
            <Zap className="h-4 w-4" />
            Express Interest (Ping)
          </Button>
        </CardContent>
      </Card>

      {/* Job detail sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[85vh] overflow-y-auto pb-8">
          <SheetHeader className="text-left pb-4 border-b">
            <SheetTitle className="text-xl">{job.title}</SheetTitle>
            <SheetDescription className="text-base">{job.companyName}</SheetDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className={cn('text-xs', typeColors[job.type])}>
                {job.type}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {job.location.address}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" /> {job.salary}
              </span>
            </div>
          </SheetHeader>

          <div className="space-y-5 mt-5">
            <div>
              <h4 className="font-semibold mb-2">About the Role</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
            </div>
            {job.requirements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <ul className="space-y-1.5">
                  {job.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
              onClick={() => {
                setDetailOpen(false);
                setTimeout(() => setPingOpen(true), 200);
              }}
            >
              <Zap className="h-5 w-5" />
              Express Interest (Ping)
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Ping dialog */}
      <PingDialog job={job} open={pingOpen} onOpenChange={setPingOpen} />
    </>
  );
}
