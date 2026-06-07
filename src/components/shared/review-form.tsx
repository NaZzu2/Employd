'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, MessageSquare } from 'lucide-react';

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
import { StarRatingInput } from '@/components/shared/star-rating';
import { BadgePicker } from '@/components/shared/badge-display';
import { useToast } from '@/hooks/use-toast';
import { submitReview } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { BADGE_LIMITS } from '@/lib/types';
import type { BadgeType, StarRating, Contract } from '@/lib/types';

const schema = z.object({
  comment: z.string().max(500, 'Max 500 characters.').optional(),
});

interface ReviewFormProps {
  contract: Contract;
  recipientName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ contract, recipientName, onSuccess }: ReviewFormProps) {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [stars, setStars] = useState<StarRating | 0>(0);
  const [selectedBadges, setSelectedBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { comment: '' } });

  if (!userDoc) return null;

  const maxBadges = BADGE_LIMITS[userDoc.subscriptionTier] ?? 1;
  const toUid =
    userDoc.role === 'employer' ? contract.workerId : contract.employerId;

  const onSubmit = async (values: { comment?: string }) => {
    if (stars === 0) {
      toast({ variant: 'destructive', title: 'Please select a star rating.' });
      return;
    }
    if (selectedBadges.length > maxBadges) {
      toast({
        variant: 'destructive',
        title: 'Badge limit exceeded',
        description: `Your plan only allows up to ${maxBadges} badge(s) per review.`,
      });
      return;
    }
    setLoading(true);
    try {
      await submitReview({
        fromUid: userDoc.uid,
        fromName: userDoc.displayName,
        fromRole: userDoc.role,
        toUid,
        stars: stars as StarRating,
        badge: selectedBadges[0] || undefined,
        badges: selectedBadges,
        comment: values.comment || undefined,
        contractId: contract.id,
      });
      toast({ title: 'Review submitted!', description: `You reviewed ${recipientName}.` });
      onSuccess?.();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to submit review', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Star rating */}
        <div>
          <p className="text-sm font-medium mb-2">Your rating</p>
          <StarRatingInput value={stars} onChange={setStars} size="lg" />
        </div>

        {/* Badge picker */}
        <div>
          <BadgePicker
            selectedBadges={selectedBadges}
            onChangeBadges={setSelectedBadges}
            maxBadges={maxBadges}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5 italic">
            {maxBadges === 1
              ? "You can award 1 badge per review on your current plan."
              : `You can award up to ${maxBadges} badges per review on your current plan.`}
          </p>
        </div>

        {/* Comment */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Comment <span className="text-muted-foreground font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Tell others about your experience with ${recipientName}…`}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading || stars === 0} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
          Submit Review
        </Button>
      </form>
    </Form>
  );
}
