'use client';

import { use, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageThread } from '@/components/shared/message-thread';
import { getConversation, getEmployerProfile, getMessages } from '@/lib/firestore';
import { hasValidConfig } from '@/lib/firebase';
import { FINNISH_EMPLOYERS } from '@/lib/data';
import type { Conversation, EmployerProfile } from '@/lib/types';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function EmployeeConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasEmployerMessages, setHasEmployerMessages] = useState(false);

  useEffect(() => {
    (async () => {
      if (!hasValidConfig) {
        const employer = FINNISH_EMPLOYERS[0];
        setConv({
          id: conversationId,
          employerId: employer.uid,
          employerName: employer.displayName,
          workerId: 'demo-worker',
          workerName: 'Demo Employee',
          jobPostId: undefined,
          jobTitle: 'Autoasentaja',
          lastMessage: 'Hei! Kiinnostuitko työstä?',
          lastMessageAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          lastMessageSenderId: employer.uid,
          lastMessageSeen: false,
        });
        setEmployer(employer);
        setHasEmployerMessages(true);
        setLoading(false);
        return;
      }

      try {
        const conversation = await getConversation(conversationId);
        setConv(conversation);
        if (conversation) {
          const ep = await getEmployerProfile(conversation.employerId);
          setEmployer(ep);
          const msgs = await getMessages(conversationId);
          setHasEmployerMessages(msgs.some((m) => m.senderRole === 'employer'));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  const otherName = conv?.employerName ?? 'Employer';
  const otherAvatar = employer?.avatarUrl;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/employee/messages">
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
