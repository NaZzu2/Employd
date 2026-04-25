'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn, timeAgo } from '@/lib/utils';
import { sendMessage, getMessages } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import type { Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface MessageThreadProps {
  conversationId: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
}

export function MessageThread({
  conversationId,
  otherPartyName,
  otherPartyAvatar,
}: MessageThreadProps) {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages(conversationId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === userDoc?.uid;
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
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed',
                  isMe
                    ? 'bg-accent text-accent-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm',
                )}
              >
                <p>{msg.text}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    isMe ? 'text-accent-foreground/60 text-right' : 'text-muted-foreground',
                  )}
                >
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Send bar */}
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
    </div>
  );
}
