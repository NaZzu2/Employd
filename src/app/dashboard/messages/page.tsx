'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Clock, Zap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { timeAgo } from '@/lib/utils';
import { getUserConversations, subscribeToConversations } from '@/lib/firestore';
import { hasValidConfig } from '@/lib/firebase';
import { FINNISH_WORKERS } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { THREAD_LIMITS } from '@/lib/types';
import type { Conversation } from '@/lib/types';
import { UpgradePrompt } from '@/components/shared/upgrade-prompt';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { userDoc, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userDoc) { setLoading(false); return; }
    if (hasValidConfig) {
      const unsub = subscribeToConversations(userDoc.uid, 'employer', (convs) => {
        setConversations(convs);
        setLoading(false);
      });
      return () => unsub();
    }

    // Fallback mock conversations for local testing when Firebase is not configured
    const mocks = FINNISH_WORKERS.slice(0, 3).map((w, i) => ({
      id: `mock-fi-${w.uid}`,
      employerId: userDoc.uid,
      employerName: userDoc.displayName,
      workerId: w.uid,
      workerName: w.displayName,
      jobPostId: undefined,
      jobTitle: i === 0 ? 'Kirvesmiehen työ' : undefined,
      lastMessage: i % 2 === 0 ? 'Hei, kiinnostaisiko tarjous?' : 'Kiitos, kuulemme pian.',
      lastMessageAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastMessageSenderId: i % 2 === 0 ? w.uid : userDoc.uid,
      lastMessageSeen: i % 2 === 0 ? false : true,
    } as Conversation));
    setConversations(mocks);
    setLoading(false);
  }, [userDoc]);

  const limit = userDoc ? THREAD_LIMITS[userDoc.subscriptionTier] : 10;
  const used = userDoc?.monthlyThreadsStarted ?? 0;
  const usagePct = limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);
  const nearLimit = limit !== Infinity && usagePct >= 80;

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="space-y-3 max-w-2xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <MessageSquare className="h-10 w-10 opacity-30" />
          <p>No conversations yet. Start one from the Worker Board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your conversations with workers.
        </p>
      </div>

      {/* Monthly thread usage */}
      {limit !== Infinity && (
        <div className="max-w-2xl rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-accent" />
              Conversations this month
            </span>
            <span className={cn('font-semibold tabular-nums', nearLimit && 'text-orange-500')}>
              {used} / {limit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                nearLimit ? 'bg-orange-500' : 'bg-accent',
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {nearLimit && <UpgradePrompt reason="more_chats" compact />}
        </div>
      )}

      <div className="space-y-3 max-w-2xl">
        {conversations.map((conv) => {
          const isUnread =
            conv.lastMessage &&
            conv.lastMessageSenderId !== userDoc?.uid &&
            conv.lastMessageSeen === false;

          return (
            <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
              <Card className={cn(
                "transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                isUnread && "border-accent/40 bg-accent/5 dark:bg-accent/5"
              )}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="text-base font-semibold">
                      {conv.workerName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", isUnread ? "font-bold text-foreground" : "font-semibold text-muted-foreground")}>
                        {conv.workerName}
                      </span>
                      {isUnread && (
                        <span className="h-2.5 w-2.5 rounded-full bg-accent shrink-0 animate-pulse" />
                      )}
                      {conv.jobTitle && (
                        <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                          {conv.jobTitle}
                        </Badge>
                      )}
                    </div>
                    <p className={cn("text-sm truncate mt-0.5", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {timeAgo(conv.lastMessageAt)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
