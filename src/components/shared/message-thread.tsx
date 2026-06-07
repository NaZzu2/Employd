'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Check, CheckCheck, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { sendMessage, subscribeToMessages, markMessageSeen } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import type { Message, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// ─── Timestamp helpers ────────────────────────────────────────────────────────

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday ${time}`;

  const dayName = d.toLocaleDateString([], { weekday: 'short' });
  // If within the last week, show day name + time
  if (now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) return `${dayName} ${time}`;

  return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + time;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MessageThreadProps {
  conversationId: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  viewerRole?: UserRole;
  /** When true, the worker cannot send — employer hasn't started yet */
  workerLocked?: boolean;
  isWorkerLocked?: boolean;
}

export function MessageThread({
  conversationId,
  otherPartyName,
  otherPartyAvatar,
  viewerRole,
  workerLocked = false,
  isWorkerLocked = false,
}: MessageThreadProps) {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsub();
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark incoming messages as seen
  useEffect(() => {
    if (!userDoc) return;
    messages.forEach((msg) => {
      if (msg.senderId !== userDoc.uid && !msg.seenAt && !seenRef.current.has(msg.id)) {
        seenRef.current.add(msg.id);
        markMessageSeen(conversationId, msg.id).catch(console.error);
      }
    });
  }, [messages, conversationId, userDoc]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !userDoc) return;
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      senderId: userDoc.uid,
      senderRole: userDoc.role,
      senderName: userDoc.displayName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    try {
      await sendMessage(conversationId, {
        senderId: userDoc.uid,
        senderRole: userDoc.role,
        senderName: userDoc.displayName,
        text: optimistic.text,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to send message', description: err.message });
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }, [text, userDoc, conversationId, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find the last message sent by the current user (for "Seen" indicator)
  const lastMyMessageId = [...messages]
    .reverse()
    .find((m) => m.senderId === userDoc?.uid)?.id;

  // Determine if the employer has sent at least one message
  const hasEmployerMessages = messages.some((m) => m.senderRole === 'employer');
  
  // The worker is locked if the employer has not sent any message yet
  const sendingBlocked = viewerRole === 'worker' && (!hasEmployerMessages || workerLocked || isWorkerLocked);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && !sendingBlocked && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === userDoc?.uid;
          const isLastMine = msg.id === lastMyMessageId;
          return (
            <div
              key={msg.id}
              className={cn('flex gap-2 items-end', isMe && 'flex-row-reverse')}
            >
              {!isMe && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={otherPartyAvatar} />
                  <AvatarFallback className="text-xs">{otherPartyName[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col gap-0.5 max-w-[70%]">
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm leading-relaxed',
                    isMe
                      ? 'bg-accent text-accent-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm',
                  )}
                >
                  <p>{msg.text}</p>
                </div>
                {/* Timestamp + seen receipt */}
                <div
                  className={cn(
                    'flex items-center gap-1 text-[11px] text-muted-foreground',
                    isMe && 'justify-end',
                  )}
                >
                  <span>{formatMessageTime(msg.createdAt)}</span>
                  {isMe && isLastMine && (
                    msg.seenAt ? (
                      <span className="flex items-center gap-0.5 text-accent">
                        <CheckCheck className="h-3 w-3" />
                        <span>Seen</span>
                      </span>
                    ) : (
                      <Check className="h-3 w-3" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Send bar */}
      {sendingBlocked ? (
        <div className="border-t p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Waiting for the employer to start the conversation…</span>
        </div>
      ) : (
        <div className="border-t p-3 flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="resize-none flex-1 min-h-[40px] max-h-[120px]"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
