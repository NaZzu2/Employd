'use client';

import { useEffect, useState } from 'react';
import { Star, CheckCircle2, Award, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewForm } from '@/components/shared/review-form';
import { BadgeDisplay, BadgeChip } from '@/components/shared/badge-display';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  markContractComplete,
  subscribeToUserContracts,
  getReviewsForUser,
  hasReviewedContract,
} from '@/lib/firestore';
import type { Contract, Review, BadgeType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { summarizeReviews } from '@/lib/review-summary';

export default function ReviewsPage() {
  const { userDoc, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [received, setReceived] = useState<Review[]>([]);
  const [reviewedContractIds, setReviewedContractIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<Contract | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  // Live contracts for this employer
  useEffect(() => {
    if (!userDoc?.uid) { setLoading(false); return; }
    const unsub = subscribeToUserContracts(userDoc.uid, 'employer', (cs) => {
      setContracts(cs.filter((c) => c.status === 'active' || c.status === 'completed'));
      setLoading(false);
    });
    return () => unsub();
  }, [userDoc?.uid]);

  // Received reviews
  const loadReviews = async () => {
    if (!userDoc?.uid) return;
    const rs = await getReviewsForUser(userDoc.uid);
    setReceived(rs);
  };

  useEffect(() => {
    loadReviews().catch(console.error);
  }, [userDoc?.uid]);

  // Which of the visible contracts has this employer already reviewed?
  useEffect(() => {
    if (!userDoc?.uid || contracts.length === 0) return;
    let active = true;
    Promise.all(contracts.map((c) => hasReviewedContract(userDoc.uid, c.id).then((r) => [c.id, r] as const)))
      .then((pairs) => {
        if (!active) return;
        setReviewedContractIds(new Set(pairs.filter(([, r]) => r).map(([id]) => id)));
      })
      .catch(console.error);
    return () => { active = false; };
  }, [contracts, userDoc?.uid]);

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

  const handleReviewSuccess = () => {
    const justReviewed = reviewTarget;
    setReviewTarget(null);
    loadReviews();
    if (justReviewed) {
      setReviewedContractIds((prev) => new Set(prev).add(justReviewed.id));
    }
  };

  const { averageRating: avgRating, reviewCount, badgeCounts } = summarizeReviews(received);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                <p className="text-2xl font-bold">{reviewCount}</p>
                <p className="text-sm text-muted-foreground">Reviews received</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-2">Badges earned</p>
              {badgeCounts ? (
                <BadgeDisplay badgeCounts={badgeCounts} compact />
              ) : (
                <p className="text-xs text-muted-foreground">No badges yet.</p>
              )}
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
              contracts.map((contract) => {
                const alreadyReviewed = reviewedContractIds.has(contract.id);
                return (
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
                        {alreadyReviewed ? (
                          <Badge variant="secondary" className="text-xs self-center">Reviewed</Badge>
                        ) : (
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
                );
              })
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
              onSuccess={handleReviewSuccess}
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
            {review.badges && review.badges.length > 0 ? (
              review.badges.map((b) => (
                <BadgeChip key={b} type={b as BadgeType} size="sm" />
              ))
            ) : review.badge ? (
              <BadgeChip type={review.badge as BadgeType} size="sm" />
            ) : null}
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
