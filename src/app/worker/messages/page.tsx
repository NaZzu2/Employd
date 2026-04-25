'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { timeAgo } from '@/lib/utils';
import type { Conversation } from '@/lib/types';

const MOCK_CONVS: Conversation[] = [
  {
    id: 'c1',
    employerId: 'emp1',
    employerName: 'AquaFlow Plumbing',
    workerId: 'w1',
    workerName: 'Alex Martinez',
    jobTitle: 'Licensed Plumber',
    lastMessage: "We'd love to have you start next Monday!",
    lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function WorkerMessagesPage() {
  const [conversations] = useState<Conversation[]>(MOCK_CONVS);

  if (conversations.length === 0) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <MessageSquare className="h-10 w-10 opacity-30" />
          <p className="text-sm text-center">
            No messages yet. Employers will reach out here after you ping their jobs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <h1 className="text-xl font-bold">Messages</h1>
      <div className="space-y-3">
        {conversations.map((conv) => (
          <Link key={conv.id} href={`/worker/messages/${conv.id}`}>
            <Card className="transition-all active:scale-[0.98] cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="font-semibold">
                    {conv.employerName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{conv.employerName}</span>
                    {conv.jobTitle && (
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                        {conv.jobTitle}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
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
        ))}
      </div>
    </div>
  );
}
