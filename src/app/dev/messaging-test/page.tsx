"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MessageThread } from '@/components/shared/message-thread';
import { FINNISH_WORKERS } from '@/lib/data';

export default function MessagingTestPage() {
  const [conversationId, setConversationId] = useState('dev-chat-1');
  const [viewerRole, setViewerRole] = useState<'employer' | 'worker'>('employer');
  const other = FINNISH_WORKERS[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messaging Test (Dev)</h1>
        <Link href="/">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>

      <div className="max-w-2xl space-y-3">
        <p className="text-sm text-muted-foreground">
          This page allows quick manual testing of the chat UI. It works with or without Firebase configured —
          when Firebase is not configured the thread uses local mock messages and allows local sends.
        </p>

        <div className="flex gap-2">
          <Select onValueChange={(v) => setViewerRole(v as 'employer' | 'worker')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Viewer role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employer">Employer</SelectItem>
              <SelectItem value="worker">Worker</SelectItem>
            </SelectContent>
          </Select>

          <Input value={conversationId} onChange={(e) => setConversationId(e.target.value)} className="flex-1" />
        </div>

        <div className="rounded-md border p-3">
          <p className="text-sm mb-2">Conversation: <strong>{conversationId}</strong></p>
          <MessageThread
            conversationId={conversationId}
            otherPartyName={other.displayName}
            otherPartyAvatar={other.avatarUrl}
            viewerRole={viewerRole}
          />
        </div>
      </div>
    </div>
  );
}
