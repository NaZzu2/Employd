'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { timeAgo, cn } from '@/lib/utils';
import { getUserConversations, subscribeToConversations } from '@/lib/firestore';
import { hasValidConfig } from '@/lib/firebase';
import { FINNISH_EMPLOYERS } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import type { Conversation } from '@/lib/types';

export default function EmployeeMessagesPage() {
  const { userDoc } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userDoc) return;

    if (hasValidConfig) {
      const unsub = subscribeToConversations(userDoc.uid, 'worker', (convs) => {
        setConversations(convs);
        setLoading(false);
      });
      return () => unsub();
    }

    const mocks = FINNISH_EMPLOYERS.slice(0, 3).map((employer, index) => ({
      id: `mock-employee-${index}`,
      employerId: employer.uid,
      employerName: employer.displayName,
      workerId: userDoc.uid,
      workerName: userDoc.displayName,
      jobPostId: undefined,
      jobTitle: index === 0 ? 'Puutarhatyöt' : undefined,
      lastMessage: index % 2 === 0 ? 'Hei! Kiinnostaisiko sinua tämä projekti?' : 'Voimmeko sopia työajankohdasta?',
      lastMessageAt: new Date(Date.now() - index * 120 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastMessageSenderId: index % 2 === 0 ? employer.uid : userDoc.uid,
      lastMessageSeen: index % 2 === 0 ? false : true,
    } as Conversation));

    setConversations(mocks);
    setLoading(false);
  }, [userDoc]);

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-24 space-y-4">
      <h1 className="text-xl font-bold">Messages</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <MessageSquare className="h-10 w-10 opacity-30" />
          <p className="text-sm text-center">
            No conversations yet — start by pinging a job or replying to an employer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const isUnread =
              conv.lastMessage &&
              conv.lastMessageSenderId !== userDoc?.uid &&
              conv.lastMessageSeen === false;

            return (
              <Link key={conv.id} href={`/employee/messages/${conv.id}`}>
                <Card className={cn(
                  'transition-all active:scale-[0.98] cursor-pointer',
                  isUnread && 'border-accent/40 bg-accent/5 dark:bg-accent/5',
                )}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="font-semibold">{conv.employerName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm',
                            isUnread ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground',
                          )}
                        >
                          {conv.employerName}
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
                      <p className={cn('text-sm truncate mt-0.5', isUnread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
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
      )}
    </div>
  );
}
