'use client';

import { use, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageThread } from '@/components/shared/message-thread';
import { getConversation, getWorkerProfile } from '@/lib/firestore';
import type { Conversation, WorkerProfile } from '@/lib/types';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversation(conversationId)
      .then(async (c) => {
        setConv(c);
        if (c) {
          const wp = await getWorkerProfile(c.workerId);
          setWorker(wp);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conversationId]);

  const otherName = conv?.workerName ?? 'Worker';
  const otherAvatar = worker?.avatarUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Back nav */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/messages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherAvatar} />
              <AvatarFallback className="text-xs font-semibold">{otherName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm leading-tight">{otherName}</p>
              {conv?.jobTitle && (
                <p className="text-xs text-muted-foreground">{conv.jobTitle}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border mt-4">
        <MessageThread
          conversationId={conversationId}
          otherPartyName={otherName}
          otherPartyAvatar={otherAvatar}
          viewerRole="employer"
        />
      </div>
    </div>
  );
}
