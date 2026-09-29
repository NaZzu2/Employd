'use client';

import { useEffect, useState } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Award,
  Briefcase,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ReviewForm } from '@/components/shared/review-form';
import { BadgeDisplay } from '@/components/shared/badge-display';
import { BadgeChip } from '@/components/shared/badge-display';
import {
  workerRespondToContract,
  subscribeToUserContracts,
  getReviewsForUser,
  hasReviewedContract,
} from '@/lib/firestore';
import { timeAgo } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import type { Contract, Review, BadgeType } from '@/lib/types';

export default function WorkerReviewsPage() {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [received, setReceived] = useState<Review[]>([]);
  const [reviewedContractIds, setReviewedContractIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<Contract | null>(null);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!userDoc?.uid) { setLoading(false); return; }
    const unsub = subscribeToUserContracts(userDoc.uid, 'worker', (cs) => {
      setContracts(cs);
      setLoading(false);
    });
    return () => unsub();
  }, [userDoc?.uid]);

  const loadReviews = async () => {
    if (!userDoc?.uid) return;
    const rs = await getReviewsForUser(userDoc.uid);
    setReceived(rs);
  };

  useEffect(() => {
    loadReviews().catch(console.error);
  }, [userDoc?.uid]);

  const pendingContracts = contracts.filter((c) => c.status === 'pending_worker_acceptance');
  const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'completed');

  useEffect(() => {
    if (!userDoc?.uid || activeContracts.length === 0) return;
    let active = true;
    Promise.all(activeContracts.map((c) => hasReviewedContract(userDoc.uid, c.id).then((r) => [c.id, r] as const)))
      .then((pairs) => {
        if (!active) return;
        setReviewedContractIds(new Set(pairs.filter(([, r]) => r).map(([id]) => id)));
      })
      .catch(console.error);
    return () => { active = false; };
  }, [contracts, userDoc?.uid]);

  // Handle hire accept/decline
  const handleRespond = async (contract: Contract, accept: boolean) => {
    setResponding(contract.id);
    try {
      await workerRespondToContract(contract.id, accept);
      if (accept) {
        toast({
          title: '🎉 You accepted the job!',
          description: `You are now working with ${contract.employerName}.`,
        });
      } else {
        toast({ title: 'Job offer declined.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setResponding(null);
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

  const avgRating = userDoc?.averageRating ?? 0;
  const reviewCount = userDoc?.reviewCount ?? received.length;
  const badgeCounts = userDoc?.badgeCounts;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-5 pb-4 space-y-5">
        <h1 className="text-xl font-bold">Reviews & Contracts</h1>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              <div>
                <p className="text-xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Award className="h-6 w-6 text-accent" />
              <div>
                <p className="text-xl font-bold">{reviewCount}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges earned */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Badges Earned</p>
            {badgeCounts ? (
              <BadgeDisplay badgeCounts={badgeCounts} compact />
            ) : (
              <p className="text-xs text-muted-foreground">No badges yet.</p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Hire Requests
              {pendingContracts.length > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-accent text-accent-foreground text-xs">
                  {pendingContracts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Contracts</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
          </TabsList>

          {/* ── Pending hire requests ─────────────────────────────── */}
          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingContracts.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                <Briefcase className="h-8 w-8 opacity-30" />
                <p className="text-sm">No pending hire requests.</p>
              </div>
            ) : (
              pendingContracts.map((contract) => (
                <Card
                  key={contract.id}
                  className="border-2 border-accent/40 bg-accent/5"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-accent">
                        Hire Request
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{contract.employerName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{contract.employerName}</p>
                        <p className="text-xs text-muted-foreground">{contract.jobTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {timeAgo(contract.createdAt)}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
                      <strong>{contract.employerName}</strong> wants to hire you for{' '}
                      <strong>{contract.jobTitle}</strong>. Do you accept?
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                        disabled={responding === contract.id}
                        onClick={() => handleRespond(contract, false)}
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={responding === contract.id}
                        onClick={() => handleRespond(contract, true)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── Active / Completed contracts ──────────────────────── */}
          <TabsContent value="active" className="space-y-3 mt-4">
            {activeContracts.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                <Briefcase className="h-8 w-8 opacity-30" />
                <p className="text-sm">No active contracts.</p>
              </div>
            ) : (
              activeContracts.map((contract) => {
                const alreadyReviewed = reviewedContractIds.has(contract.id);
                return (
                  <Card key={contract.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{contract.employerName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{contract.employerName}</p>
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
                      {alreadyReviewed ? (
                        <Badge variant="secondary" className="text-xs">Reviewed</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewTarget(contract)}
                        >
                          <Award className="h-3.5 w-3.5 mr-1.5" />
                          Review
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ── Received reviews ──────────────────────────────────── */}
          <TabsContent value="reviews" className="space-y-3 mt-4">
            {received.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                <Star className="h-8 w-8 opacity-30" />
                <p className="text-sm">No reviews yet.</p>
              </div>
            ) : (
              received.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{review.fromName[0]}</AvatarFallback>
                      </Avatar>
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
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Leave review sheet */}
      <Sheet open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8 overflow-y-auto max-h-[85vh]">
          <SheetHeader className="text-left pb-4">
            <SheetTitle>Review {reviewTarget?.employerName}</SheetTitle>
          </SheetHeader>
          {reviewTarget && (
            <ReviewForm
              contract={reviewTarget}
              recipientName={reviewTarget.employerName}
              onSuccess={handleReviewSuccess}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

