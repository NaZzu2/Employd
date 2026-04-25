'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Clock, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { timeAgo } from '@/lib/utils';
import type { Conversation } from '@/lib/types';

// Mock conversations for UI preview
const MOCK_CONVS: Conversation[] = [
  {
    id: 'c1',
    employerId: 'emp1',
    employerName: 'AquaFlow Plumbing',
    workerId: 'w1',
    workerName: 'Alex Martinez',
    jobTitle: 'Licensed Plumber',
    lastMessage: 'Sounds great, when can we start?',
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'c2',
    employerId: 'emp1',
    employerName: 'AquaFlow Plumbing',
    workerId: 'w2',
    workerName: 'Sam Rivera',
    jobTitle: 'Journeyman Electrician',
    lastMessage: "I'm available to start next Monday.",
    lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export default function MessagesPage() {
  const [conversations] = useState<Conversation[]>(MOCK_CONVS);

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

      <div className="space-y-3 max-w-2xl">
        {conversations.map((conv) => (
          <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
            <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="text-base font-semibold">
                    {conv.workerName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{conv.workerName}</span>
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
