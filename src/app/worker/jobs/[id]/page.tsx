'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, Clock, MapPin, Briefcase, Users } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { getJobPost } from '@/lib/firestore';
import { FINNISH_JOB_POSTS } from '@/lib/data';
import { hasValidConfig } from '@/lib/firebase';
import { PingDialog } from '@/components/worker/ping-dialog';
import { getUserDoc, getOrCreateConversation } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { JobPost } from '@/lib/types';

export default function JobDetailPage() {
  const { userDoc } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const jobId = typeof params.id === 'string' ? params.id : '';

  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPingDialog, setShowPingDialog] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadJob = async () => {
      const found = hasValidConfig
        ? await getJobPost(jobId)
        : FINNISH_JOB_POSTS.find((j) => j.id === jobId);
      if (active) setJob(found || null);
      if (active) setLoading(false);
    };
    if (jobId) loadJob();
    return () => {
      active = false;
    };
  }, [jobId]);

  const messageEmployer = async () => {
    if (!userDoc || !job) return;
    setMessagingLoading(true);
    try {
      if (!hasValidConfig) {
        const convId = `mock-${job.id}`;
        toast({ title: 'Conversation started', description: `Conversation started with ${job.companyName}.` });
        router.push(`/worker/messages/${convId}`);
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
      router.push(`/worker/messages/${conversationId}`);
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Unable to start conversation', description: error?.message ?? 'Try again later.' });
    } finally {
      setMessagingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-5 pb-24 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="px-4 pt-5 pb-24 space-y-4 text-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-24 space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{job.companyName}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{job.type}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {job.location.address}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Posted {new Date(job.postedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            {job.salary || 'Salary not specified'}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={messageEmployer} disabled={messagingLoading}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {messagingLoading ? 'Starting conversation...' : 'Message employer'}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setShowPingDialog(true)}>
            Send ping
          </Button>
        </div>

        {showPingDialog && (
          <PingDialog
            open={showPingDialog}
            onOpenChange={setShowPingDialog}
            job={job}
          />
        )}

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Requirements</h3>
            <ul className="text-sm space-y-1">
              {job.requirements.map((req: string, i: number) => (
                <li key={i} className="flex gap-2">
                  <span>•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
