'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Loader2, MapPin, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getJobPost, getJobPings } from '@/lib/firestore';
import type { JobPost, Ping } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobPost | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);

  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const jobPost = await getJobPost(id);
      setJob(jobPost);
      if (jobPost) {
        const jobPings = await getJobPings(id);
        setPings(jobPings);
      }
      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!job) {
    return <div className="space-y-4"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><p>Job not found.</p></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="w-fit" variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
            <Badge variant="outline">{pings.length} pings</Badge>
          </div>
          <CardTitle className="text-2xl">{job.title}</CardTitle>
          <p className="text-muted-foreground">{job.companyName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{job.location.address}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />Posted {timeAgo(job.postedAt)}</div>
          <p>{job.description}</p>
          <div className="flex flex-wrap gap-2">{job.requirements.map((req) => <Badge key={req} variant="outline">{req}</Badge>)}</div>
          <div className="flex gap-2">
            <Button asChild><Link href={`/dashboard/my-jobs/${job.id}/edit`}>Edit</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/my-jobs">Back to jobs</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Users className="h-5 w-5" /> Interested Workers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workers have pinged this job yet.</p>
          ) : (
            pings.map((ping) => (
              <div key={ping.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={ping.workerAvatarUrl} />
                    <AvatarFallback>{ping.workerName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{ping.workerName}</p>
                    <p className="text-sm text-muted-foreground">{ping.workerTitle || 'Worker'} • {timeAgo(ping.createdAt)}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ping.message}</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/messages`}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
