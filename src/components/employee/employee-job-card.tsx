'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, DollarSign, Clock, MessageSquare, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PingDialog } from '@/components/worker/ping-dialog';
import { timeAgo } from '@/lib/utils';
import type { JobPost } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EmployeeJobCardProps {
  job: JobPost;
  onMessageEmployer: (job: JobPost) => void;
  onPingSent?: (conversationId: string) => void;
  busy?: boolean;
}

const typeColors: Record<string, string> = {
  'Full-time': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
  'Part-time': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300',
  Contract: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300',
};

export function EmployeeJobCard({ job, onMessageEmployer, onPingSent, busy }: EmployeeJobCardProps) {
  const [pingOpen, setPingOpen] = useState(false);

  return (
    <>
      <Card className="transition-all active:scale-[0.98] cursor-pointer">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback>{job.companyName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/worker/jobs/${job.id}`} className="block">
                  <h3 className="font-semibold text-base leading-tight hover:text-accent">{job.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground">{job.companyName}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn('text-xs shrink-0', typeColors[job.type])}>
              {job.type}
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location.address}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> {job.salary}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {timeAgo(job.postedAt)}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onMessageEmployer(job);
              }}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Message Employer
                </>
              )}
            </Button>
            <Button
              className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPingOpen(true);
              }}
            >
              <Zap className="h-4 w-4" />
              Interested
            </Button>
          </div>
        </CardContent>
      </Card>

      <PingDialog
        job={job}
        open={pingOpen}
        onOpenChange={setPingOpen}
        onPingSent={onPingSent}
      />
    </>
  );
}
