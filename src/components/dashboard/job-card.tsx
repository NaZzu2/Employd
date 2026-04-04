import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import type { Job } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <Link href={`/dashboard/jobs/${job.id}`} className="block">
          <div className="relative aspect-video">
            <Image
              src={job.imageUrl}
              alt={job.title}
              data-ai-hint={job.imageHint}
              fill
              className="object-cover"
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start justify-between">
            <Badge variant="secondary" className="mb-2">{job.type}</Badge>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {job.postedAt}
            </div>
        </div>
        <Link href={`/dashboard/jobs/${job.id}`}>
            <CardTitle className="text-lg font-semibold hover:text-primary transition-colors">
            {job.title}
            </CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground mt-1">{job.company}</CardDescription>
        <div className="mt-2 flex items-center text-sm text-muted-foreground gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{job.location}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href={`/dashboard/jobs/${job.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
