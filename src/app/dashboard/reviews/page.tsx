'use client';

import { useState } from 'react';
import { Star, CheckCircle2, Clock, Award } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewForm } from '@/components/shared/review-form';
import { StarRatingDisplay } from '@/components/shared/star-rating';
import { BadgeDisplay, BadgeChip } from '@/components/shared/badge-display';
import { getBadge } from '@/lib/badge-config';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { markContractComplete } from '@/lib/firestore';
import type { Contract, Review, BadgeType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { EMPTY_BADGE_COUNTS } from '@/lib/badge-config';

// Mock data for UI preview
const MOCK_RECEIVED: Review[] = [
  {
    id: 'r1',
    fromUid: 'w1',
    fromName: 'Alex Martinez',
    fromRole: 'worker',
    toUid: 'emp1',
    stars: 5,
    badge: 'professional',
    comment: 'Great employer! Very clear with instructions and paid on time.',
    contractId: 'ct1',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'r2',
    fromUid: 'w2',
    fromName: 'Sam Rivera',
    fromRole: 'worker',
    toUid: 'emp1',
    stars: 4,
    badge: 'reliable',
    comment: 'Good experience overall.',
    contractId: 'ct2',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'ct3',
    employerId: 'emp1',
    employerName: 'AquaFlow Plumbing',
    workerId: 'w3',
    workerName: 'Jordan Kim',
    jobPostId: 'j1',
    jobTitle: 'Certified Welder',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const mockBadgeCounts = { ...EMPTY_BADGE_COUNTS, professional: 1, reliable: 1 };

export default function ReviewsPage() {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [received] = useState<Review[]>(MOCK_RECEIVED);
  const [reviewTarget, setReviewTarget] = useState<Contract | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const handleMarkComplete = async (contract: Contract) => {
    setCompleting(contract.id);
    try {
      await markContractComplete(contract.id);
      setContracts((prev) =>
        prev.map((c) => (c.id === contract.id ? { ...c, status: 'completed' } : c)),
      );
      toast({ title: 'Contract marked complete!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setCompleting(null);
    }
  };

  const avgRating =
    received.length > 0
      ? received.reduce((s, r) => s + r.stars, 0) / received.length
      : 0;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your reputation and completed contracts.
          </p>
        </div>

        {/* Summary card */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg. rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{received.length}</p>
                <p className="text-sm text-muted-foreground">Reviews received</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-2">Badges earned</p>
              <BadgeDisplay badgeCounts={mockBadgeCounts} compact />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="received">
          <TabsList>
            <TabsTrigger value="received">Received Reviews</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>

          {/* Received reviews */}
          <TabsContent value="received" className="space-y-3 mt-4">
            {received.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No reviews yet.
              </p>
            ) : (
              received.map((review) => <ReviewCard key={review.id} review={review} />)
            )}
          </TabsContent>

          {/* Contracts — leave reviews / mark complete */}
          <TabsContent value="contracts" className="space-y-3 mt-4">
            {contracts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No active contracts.
              </p>
            ) : (
              contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{contract.workerName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{contract.workerName}</p>
                      <p className="text-xs text-muted-foreground">{contract.jobTitle}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${
                          contract.status === 'active' ? 'border-accent text-accent' : ''
                        }`}
                      >
                        {contract.status === 'active' ? '🟢 Active' : '✅ Completed'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {contract.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkComplete(contract)}
                          disabled={completing === contract.id}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {contract.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => setReviewTarget(contract)}
                        >
                          <Award className="h-3.5 w-3.5 mr-1.5" />
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {reviewTarget?.workerName}</DialogTitle>
          </DialogHeader>
          {reviewTarget && (
            <ReviewForm
              contract={reviewTarget}
              recipientName={reviewTarget.workerName}
              onSuccess={() => setReviewTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback>{review.fromName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{review.fromName}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < review.stars
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            {review.badge && (
              <BadgeChip type={review.badge as BadgeType} size="sm" />
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {timeAgo(review.createdAt)}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
