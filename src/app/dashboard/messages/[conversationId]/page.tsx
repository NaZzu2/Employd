'use client';

import { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageThread } from '@/components/shared/message-thread';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Back nav */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/messages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-semibold">Conversation</h1>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border mt-4">
        <MessageThread
          conversationId={conversationId}
          otherPartyName="Worker"
        />
      </div>
    </div>
  );
}
