'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, DollarSign, Clock, MessageSquare, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getEmployerJobPosts, getEmployerProfile, getJobPost, getUserDoc, getOrCreateConversation } from '@/lib/firestore';
import { hasValidConfig } from '@/lib/firebase';
import { FINNISH_JOB_POSTS, FINNISH_EMPLOYERS } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { PingDialog } from '@/components/worker/ping-dialog';
import { timeAgo } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { JobPost, EmployerProfile } from '@/lib/types';

interface Props {
  params: { id: string };
}

export default function EmployeeJobDetailPage({ params }: Props) {
  const { id } = params;
  const { userDoc } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<JobPost | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [related, setRelated] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPingDialog, setShowPingDialog] = useState(false);

  useEffect(() => {
    (async () => {
      if (!hasValidConfig) {
        const mockJob = FINNISH_JOB_POSTS.find((jobItem) => jobItem.id === id) ?? null;
        setJob(mockJob);
        if (mockJob) {
          const mockEmployer = FINNISH_EMPLOYERS.find((e) => e.uid === mockJob.employerId) ?? null;
          setEmployer(mockEmployer);
          setRelated(FINNISH_JOB_POSTS.filter((jobItem) => jobItem.employerId === mockJob.employerId && jobItem.id !== mockJob.id));
        }
        setLoading(false);
        return;
      }

      try {
        const data = await getJobPost(id);
        if (!data) {
          setJob(null);
          setLoading(false);
          return;
        }
        setJob(data);
        const ep = await getEmployerProfile(data.employerId);
        setEmployer(ep);
        const relatedJobs = await getEmployerJobPosts(data.employerId);
        setRelated(relatedJobs.filter((item) => item.id !== data.id));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleMessageEmployer = async () => {
    if (!userDoc || !job) return;
    setBusy(true);
    try {
      if (!hasValidConfig) {
        const convId = `mock-${job.id}`;
        toast({ title: 'Conversation started', description: `Conversation started with ${job.companyName}.` });
        router.push(`/employee/messages/${convId}`);
        return;
      }

      const employerDoc = await getUserDoc(job.employerId);
      if (!employerDoc) throw new Error('Employer profile not found');
      const { conversationId } = await getOrCreateConversation(
        employerDoc,
        userDoc.uid,
        userDoc.displayName,
        job.id,
        job.title,
      );
      toast({ title: 'Conversation started', description: `Conversation started with ${job.companyName}.` });
      router.push(`/employee/messages/${conversationId}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Unable to start conversation', description: error?.message ?? 'Try again later.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePingSent = (conversationId: string) => {
    if (!conversationId) return;
    router.push(`/employee/messages/${conversationId}`);
  };

  const openPingDialog = () => setShowPingDialog(true);

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-24 space-y-4">
        <div className="h-8 w-48 rounded-full bg-muted animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="px-4 pt-6 pb-24 text-muted-foreground">
        <Link href="/employee/jobs" className="text-sm text-accent underline">Back to jobs</Link>
        <h1 className="mt-4 text-xl font-semibold">Job not found</h1>
        <p className="mt-2">This job could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/employee/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Job details</p>
          <h1 className="text-xl font-semibold">{job.title}</h1>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{job.companyName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{job.type}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location.address}</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeAgo(job.postedAt)}</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={handleMessageEmployer} disabled={busy} className="w-full">
              <MessageSquare className="h-4 w-4" />
              Message Employer
            </Button>
            <Button onClick={openPingDialog} disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Zap className="h-4 w-4" />
              Express Interest
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">About the role</h2>
            <p className="mt-2 text-sm text-muted-foreground">{job.description}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Skills & requirements</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {job.requirements.map((req) => (
                <li key={req} className="rounded-2xl border border-border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {employer && (
        <Card className="rounded-3xl border border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{employer.companyName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{employer.companyName}</p>
              <p className="text-sm text-muted-foreground">{employer.industry}</p>
              <p className="text-sm text-muted-foreground mt-1">{employer.location?.address}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {related.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">More from this employer</h2>
          </div>
          <div className="space-y-3">
            {related.map((item) => (
              <Link key={item.id} href={`/employee/jobs/${item.id}`} className="block rounded-3xl border border-border p-4 hover:border-accent hover:bg-accent/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.location.address}</p>
                  </div>
                  <Badge variant="secondary">{item.type}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <PingDialog
        job={job}
        open={showPingDialog}
        onOpenChange={setShowPingDialog}
        onPingSent={handlePingSent}
      />
    </div>
  );
}
