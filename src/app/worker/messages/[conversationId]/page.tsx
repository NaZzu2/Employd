'use client';

import { use, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageThread } from '@/components/shared/message-thread';
import { getConversation, getEmployerProfile, getMessages } from '@/lib/firestore';
import type { Conversation, EmployerProfile } from '@/lib/types';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function WorkerConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasEmployerMessages, setHasEmployerMessages] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await getConversation(conversationId);
        setConv(c);
        if (c) {
          const ep = await getEmployerProfile(c.employerId);
          setEmployer(ep);
          // Check whether the employer has sent any messages in this conversation
          try {
            const msgs = await getMessages(conversationId);
            const hasEmployer = msgs.some((m) => m.senderRole === 'employer');
            setHasEmployerMessages(hasEmployer);
          } catch (err) {
            console.error('Error fetching messages to determine worker lock state', err);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  const otherName = conv?.employerName ?? 'Employer';
  const otherAvatar = employer?.avatarUrl;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/worker/messages">
            <ArrowLeft className="h-5 w-5" />
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

      <div className="flex-1 overflow-hidden">
        <MessageThread
          conversationId={conversationId}
          otherPartyName={otherName}
          otherPartyAvatar={otherAvatar}
          viewerRole="worker"
          isWorkerLocked={!hasEmployerMessages}
        />
      </div>
    </div>
  );
}
