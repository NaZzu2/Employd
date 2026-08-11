'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getJobPost, getJobPings } from '@/lib/firestore';
import { timeAgo } from '@/lib/utils';
import type { Ping, JobPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function InterestedWorkersPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';

  const [job, setJob] = useState<JobPost | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        const j = await getJobPost(id);
        if (!mounted) return;
        setJob(j);
        if (!j) {
          toast({ variant: 'destructive', title: 'Job not found' });
          router.push('/dashboard/my-jobs');
          return;
        }
        const jobPings = await getJobPings(id);
        if (!mounted) return;
        setPings(jobPings);
      } catch (e) {
        console.error('Error loading interested workers', e);
        toast({ variant: 'destructive', title: 'Failed to load interested workers' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, router, toast]);

  useEffect(() => {
    if (sort === 'recent') {
      setPings((p) => [...p].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      setPings((p) => [...p].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    }
  }, [sort]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            <CardTitle className="text-lg">Interested Workers</CardTitle>
            <Badge variant="outline">{pings.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Sort:</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded border px-2 py-1">
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          {pings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workers have pinged this job yet.</p>
          ) : (
            pings.map((ping) => (
              <div key={ping.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {ping.workerAvatarUrl ? <AvatarImage src={ping.workerAvatarUrl} /> : <AvatarFallback>{ping.workerName?.[0] ?? '?'}</AvatarFallback>}
                  </Avatar>
                  <div>
                    <p className="font-medium">{ping.workerName}</p>
                    <p className="text-sm text-muted-foreground">{ping.workerTitle || 'Worker'} • {timeAgo(ping.createdAt)}</p>
                    {ping.message ? <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ping.message}</p> : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/worker/${ping.workerId}`}>View Profile</Link>
                  </Button>

                  <Button asChild size="sm">
                    <Link href={`/dashboard/messages?to=${ping.workerId}&job=${id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Link>
                  </Button>

                  <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Hire (stub)', description: 'Hire flow is in Task 6.' })}>
                    Hire
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getJobPost, getJobPings } from '@/lib/firestore';
import { timeAgo } from '@/lib/utils';
import type { Ping, JobPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function InterestedWorkersPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';

  const [job, setJob] = useState<JobPost | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        const j = await getJobPost(id);
        if (!mounted) return;
        setJob(j);
        if (!j) {
          toast({ variant: 'destructive', title: 'Job not found' });
          router.push('/dashboard/my-jobs');
          return;
        }
        const jobPings = await getJobPings(id);
        if (!mounted) return;
        setPings(jobPings);
      } catch (e) {
        console.error('Error loading interested workers', e);
        toast({ variant: 'destructive', title: 'Failed to load interested workers' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, router, toast]);

  useEffect(() => {
    if (sort === 'recent') {
      setPings((p) => [...p].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      setPings((p) => [...p].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    }
  }, [sort]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            <CardTitle className="text-lg">Interested Workers</CardTitle>
            <Badge variant="outline">{pings.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Sort:</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded border px-2 py-1">
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          {pings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workers have pinged this job yet.</p>
          ) : (
            pings.map((ping) => (
              <div key={ping.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {ping.workerAvatarUrl ? <AvatarImage src={ping.workerAvatarUrl} /> : <AvatarFallback>{ping.workerName?.[0] ?? '?'}</AvatarFallback>}
                  </Avatar>
                  <div>
                    <p className="font-medium">{ping.workerName}</p>
                    <p className="text-sm text-muted-foreground">{ping.workerTitle || 'Worker'} • {timeAgo(ping.createdAt)}</p>
                    {ping.message ? <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ping.message}</p> : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/worker/${ping.workerId}`}>View Profile</Link>
                  </Button>

                  <Button asChild size="sm">
                    <Link href={`/dashboard/messages?to=${ping.workerId}&job=${id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Link>
                  </Button>

                  <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Hire (stub)', description: 'Hire flow is in Task 6.' })}>
                    Hire
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getJobPost, getJobPings } from '@/lib/firestore';
import { timeAgo } from '@/lib/utils';
import type { Ping, JobPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function InterestedWorkersPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';

  const [job, setJob] = useState<JobPost | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        const j = await getJobPost(id);
        if (!mounted) return;
        setJob(j);
        if (!j) {
          toast({ variant: 'destructive', title: 'Job not found' });
          router.push('/dashboard/my-jobs');
          return;
        }
        const jobPings = await getJobPings(id);
        if (!mounted) return;
        setPings(jobPings);
      } catch (e) {
        console.error('Error loading interested workers', e);
        toast({ variant: 'destructive', title: 'Failed to load interested workers' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, router, toast]);

  useEffect(() => {
    if (sort === 'recent') {
      setPings((p) => [...p].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      setPings((p) => [...p].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    }
  }, [sort]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            <CardTitle className="text-lg">Interested Workers</CardTitle>
            <Badge variant="outline">{pings.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Sort:</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded border px-2 py-1">
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          {pings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workers have pinged this job yet.</p>
          ) : (
            pings.map((ping) => (
              <div key={ping.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {ping.workerAvatarUrl ? <AvatarImage src={ping.workerAvatarUrl} /> : <AvatarFallback>{ping.workerName?.[0] ?? '?'}</AvatarFallback>}
                  </Avatar>
                  <div>
                    <p className="font-medium">{ping.workerName}</p>
                    <p className="text-sm text-muted-foreground">{ping.workerTitle || 'Worker'} • {timeAgo(ping.createdAt)}</p>
                    {ping.message ? <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ping.message}</p> : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/worker/${ping.workerId}`}>
                      View Profile
                    </Link>
                  </Button>

                  <Button asChild size="sm">
                    <Link href={`/dashboard/messages?to=${ping.workerId}&job=${id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Link>
                  </Button>

                  <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Hire (stub)', description: 'Hire flow is in Task 6.' })}>
                    Hire
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
