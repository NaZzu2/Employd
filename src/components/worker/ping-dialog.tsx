'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Zap } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { sendPing } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { JobPost } from '@/lib/types';

const schema = z.object({
  message: z
    .string()
    .min(10, 'Please write at least 10 characters.')
    .max(300, 'Max 300 characters.'),
});

interface PingDialogProps {
  job: JobPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PingDialog({ job, open, onOpenChange }: PingDialogProps) {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  });

  const onSubmit = async ({ message }: { message: string }) => {
    if (!userDoc) return;
    setLoading(true);
    try {
      await sendPing({
        workerId: userDoc.uid,
        workerName: userDoc.displayName,
        workerTitle: '',       // filled from workerProfile in a real app
        workerAvatarUrl: userDoc.avatarUrl,
        jobPostId: job.id,
        jobTitle: job.title,
        employerId: job.employerId,
        message,
      });
      toast({
        title: '⚡ Ping sent!',
        description: `${job.companyName} has been notified of your interest.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to send ping', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Express Interest
          </SheetTitle>
          <SheetDescription>
            Send a brief message to <strong>{job.companyName}</strong> about the{' '}
            <strong>{job.title}</strong> role. They can start a conversation if interested.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. I'm very interested in this role. I have 5 years of experience in…"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground text-right">
                    {field.value.length}/300
                  </p>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Send Ping
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
