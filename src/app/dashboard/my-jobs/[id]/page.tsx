'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getJobPost } from '@/lib/firestore';
import type { JobPost } from '@/lib/types';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);

  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!id) return;
    getJobPost(id)
      .then(setJob)
      .finally(() => setLoading(false));
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
          <Badge className="w-fit" variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
          <CardTitle className="text-2xl">{job.title}</CardTitle>
          <p className="text-muted-foreground">{job.companyName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{job.location.address}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />Posted {job.postedAt}</div>
          <p>{job.description}</p>
          <div className="flex flex-wrap gap-2">{job.requirements.map((req) => <Badge key={req} variant="outline">{req}</Badge>)}</div>
          <div className="flex gap-2">
            <Button asChild><Link href={`/dashboard/my-jobs/${job.id}/edit`}>Edit</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/my-jobs">Back to jobs</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
