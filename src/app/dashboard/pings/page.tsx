'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, MessageSquare, Clock, Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { updatePingStatus, startConversation } from '@/lib/firestore';
import { canStartThread, timeAgo } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import type { Ping } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const MOCK_PINGS: Ping[] = [
  {
    id: 'p1',
    workerId: 'w1',
    workerName: 'Alex Martinez',
    workerTitle: 'Lead Carpenter',
    jobPostId: 'j1',
    jobTitle: 'Licensed Plumber',
    employerId: 'emp1',
    message: "I'm very interested in this role. I have 8 years of experience and am available immediately.",
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'p2',
    workerId: 'w2',
    workerName: 'Sam Rivera',
    workerTitle: 'Journeyman Electrician',
    jobPostId: 'j1',
    jobTitle: 'Licensed Plumber',
    employerId: 'emp1',
    message: "Would love to discuss this opportunity. I have relevant experience.",
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function PingsPage() {
  const { userDoc } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pings, setPings] = useState<Ping[]>(MOCK_PINGS);
  const [replyTarget, setReplyTarget] = useState<Ping | null>(null);

  const handleDecline = async (ping: Ping) => {
    await updatePingStatus(ping.id, 'declined');
    setPings((prev) => prev.map((p) => (p.id === ping.id ? { ...p, status: 'declined' } : p)));
  };

  const handleReply = async () => {
    if (!userDoc || !replyTarget) return;
    if (!canStartThread(userDoc.subscriptionTier, userDoc.monthlyThreadsStarted)) {
      toast({
        variant: 'destructive',
        title: 'Thread limit reached',
        description: 'Upgrade your plan to start more conversations.',
      });
      return;
    }
    try {
      await updatePingStatus(replyTarget.id, 'accepted');
      const convId = await startConversation(
        userDoc,
        replyTarget.workerId,
        replyTarget.workerName,
        replyTarget.jobPostId,
        replyTarget.jobTitle,
      );
      setPings((prev) =>
        prev.map((p) => (p.id === replyTarget.id ? { ...p, status: 'accepted' } : p)),
      );
      router.push(`/dashboard/messages/${convId}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setReplyTarget(null);
    }
  };

  const pending = pings.filter((p) => p.status === 'pending');
  const handled = pings.filter((p) => p.status !== 'pending');

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Workers who expressed interest in your job listings.
          </p>
        </div>

        {pings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Zap className="h-10 w-10 opacity-30" />
            <p>No pings yet. Workers who are interested in your jobs will appear here.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Pending ({pending.length})
                </h2>
                {pending.map((ping) => (
                  <PingCard
                    key={ping.id}
                    ping={ping}
                    onReply={() => setReplyTarget(ping)}
                    onDecline={() => handleDecline(ping)}
                  />
                ))}
              </section>
            )}
            {handled.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Handled ({handled.length})
                </h2>
                {handled.map((ping) => (
                  <PingCard key={ping.id} ping={ping} />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!replyTarget} onOpenChange={() => setReplyTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reply to {replyTarget?.workerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will accept their ping and open a conversation thread. This counts
              toward your monthly thread limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReply}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PingCard({
  ping,
  onReply,
  onDecline,
}: {
  ping: Ping;
  onReply?: () => void;
  onDecline?: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={ping.workerAvatarUrl} />
            <AvatarFallback>{ping.workerName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-sm">{ping.workerName}</span>
              <span className="text-xs text-muted-foreground">{ping.workerTitle}</span>
              <Badge
                variant={
                  ping.status === 'pending'
                    ? 'outline'
                    : ping.status === 'accepted'
                    ? 'default'
                    : 'secondary'
                }
                className={`text-xs ml-auto ${ping.status === 'accepted' ? 'bg-accent/15 text-accent' : ''}`}
              >
                {ping.status === 'accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {ping.status === 'declined' && <XCircle className="h-3 w-3 mr-1" />}
                {ping.status.charAt(0).toUpperCase() + ping.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Briefcase className="h-3 w-3" />
              <span>{ping.jobTitle}</span>
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" />
              <span>{timeAgo(ping.createdAt)}</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
              &ldquo;{ping.message}&rdquo;
            </p>
            {ping.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onReply} className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Reply
                </Button>
                <Button size="sm" variant="outline" onClick={onDecline}>
                  Decline
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
