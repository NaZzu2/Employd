'use client';

import { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageThread } from '@/components/shared/message-thread';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function WorkerConversationPage({ params }: Props) {
  const { conversationId } = use(params);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/worker/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="font-semibold">Conversation</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <MessageThread
          conversationId={conversationId}
          otherPartyName="Employer"
        />
      </div>
    </div>
  );
}
