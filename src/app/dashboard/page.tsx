'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  SortAsc,
  MapPin,
  UserCheck,
  Star,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { WorkerCard } from '@/components/dashboard/worker-card';
import { useAuth } from '@/lib/auth-context';
import { getAllWorkerProfiles, startConversation, createContract } from '@/lib/firestore';
import { isWithinRange, haversineDistanceKm, canStartThread } from '@/lib/utils';
import type { WorkerProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type SortMode = 'available' | 'rating' | 'badges';

// ─── Mock data (used when Firebase is not configured) ────────────────────────
const MOCK_WORKERS: WorkerProfile[] = [
  {
    uid: 'mock-1',
    displayName: 'Alex Martinez',
    title: 'Lead Carpenter',
    summary: 'Versatile trades professional with 8+ years in commercial and residential settings.',
    skills: ['Finish Carpentry', 'Framing', 'Drywall', 'Blueprint Reading'],
    isLookingForWork: true,
    averageRating: 4.7,
    reviewCount: 12,
    badgeCounts: { punctual: 5, reliable: 8, quality: 3, professional: 2, goes_above: 1 },
    location: { lat: 40.68, lng: -73.94, address: 'Brooklyn, NY' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'mock-2',
    displayName: 'Sam Rivera',
    title: 'Journeyman Electrician',
    summary: 'Licensed electrician with expertise in commercial wiring and solar installations.',
    skills: ['Commercial Wiring', 'Solar Panels', 'Blueprints', 'Safety Compliance'],
    isLookingForWork: true,
    averageRating: 4.9,
    reviewCount: 7,
    badgeCounts: { punctual: 7, reliable: 6, quality: 5, professional: 4, goes_above: 2 },
    location: { lat: 34.05, lng: -118.24, address: 'Los Angeles, CA' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'mock-3',
    displayName: 'Jordan Kim',
    title: 'Certified Welder',
    summary: 'AWS-certified welder specializing in MIG, TIG and structural steel fabrication.',
    skills: ['MIG Welding', 'TIG Welding', 'Structural Steel', 'Fabrication'],
    isLookingForWork: false,
    averageRating: 4.2,
    reviewCount: 5,
    badgeCounts: { punctual: 2, reliable: 3, quality: 4, professional: 1, goes_above: 0 },
    location: { lat: 29.76, lng: -95.37, address: 'Houston, TX' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
];

export default function WorkerBoardPage() {
  const { userDoc } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [workers] = useState<WorkerProfile[]>(MOCK_WORKERS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('available');
  const [radius, setRadius] = useState(userDoc?.searchRadiusKm ?? 100);
  const [filterByRange, setFilterByRange] = useState(false);

  // Hire dialog state
  const [hireTarget, setHireTarget] = useState<WorkerProfile | null>(null);
  const [hiring, setHiring] = useState(false);

  // ── Filter & sort ───────────────────────────────────────────────────────────
  const userLat = userDoc?.location?.lat;
  const userLng = userDoc?.location?.lng;

  const filtered = workers
    .filter((w) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        w.displayName.toLowerCase().includes(q) ||
        w.title.toLowerCase().includes(q) ||
        w.location?.address.toLowerCase().includes(q) ||
        w.skills.some((s) => s.toLowerCase().includes(q));

      const matchesRange =
        !filterByRange ||
        !userLat ||
        !userLng ||
        !w.location ||
        isWithinRange(userLat, userLng, w.location.lat, w.location.lng, radius);

      return matchesSearch && matchesRange;
    })
    .sort((a, b) => {
      if (sort === 'available') {
        if (a.isLookingForWork !== b.isLookingForWork)
          return a.isLookingForWork ? -1 : 1;
        return b.averageRating - a.averageRating;
      }
      if (sort === 'rating') return b.averageRating - a.averageRating;
      if (sort === 'badges') {
        const sumA = Object.values(a.badgeCounts).reduce((s, n) => s + n, 0);
        const sumB = Object.values(b.badgeCounts).reduce((s, n) => s + n, 0);
        return sumB - sumA;
      }
      return 0;
    });

  // ── Conversation ────────────────────────────────────────────────────────────
  const handleStartConversation = async (worker: WorkerProfile) => {
    if (!userDoc) return;
    if (!canStartThread(userDoc.subscriptionTier, userDoc.monthlyThreadsStarted)) {
      toast({
        variant: 'destructive',
        title: 'Thread limit reached',
        description: 'Upgrade your subscription to start more conversations this month.',
      });
      return;
    }
    try {
      const convId = await startConversation(userDoc, worker.uid, worker.displayName);
      router.push(`/dashboard/messages/${convId}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  // ── Hire ────────────────────────────────────────────────────────────────────
  const handleMarkHired = (worker: WorkerProfile) => setHireTarget(worker);

  const confirmHire = async () => {
    if (!userDoc || !hireTarget) return;
    setHiring(true);
    try {
      await createContract({
        employerId: userDoc.uid,
        employerName: userDoc.displayName,
        workerId: hireTarget.uid,
        workerName: hireTarget.displayName,
        jobPostId: '',
        jobTitle: hireTarget.title,
      });
      toast({
        title: '🎉 Hire request sent!',
        description: `${hireTarget.displayName} will be notified to accept.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setHiring(false);
      setHireTarget(null);
    }
  };

  const distanceTo = (w: WorkerProfile) => {
    if (!userLat || !userLng || !w.location) return undefined;
    return haversineDistanceKm(userLat, userLng, w.location.lat, w.location.lng);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Worker Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse available workers and find your next hire.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, location, skill, occupation…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SortAsc className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort workers by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                <DropdownMenuRadioItem value="available">
                  <UserCheck className="h-4 w-4 mr-2" /> Available First
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rating">
                  <Star className="h-4 w-4 mr-2" /> Highest Rated
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="badges">
                  <Zap className="h-4 w-4 mr-2" /> Most Badges
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Range filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filterByRange ? 'default' : 'outline'}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                {filterByRange ? `≤ ${radius} km` : 'Range'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Search radius: {radius} km</Label>
                  <Slider
                    min={10}
                    max={500}
                    step={10}
                    value={[radius]}
                    onValueChange={([v]) => setRadius(v)}
                    className="mt-2"
                  />
                </div>
                <Button
                  variant={filterByRange ? 'destructive' : 'default'}
                  size="sm"
                  className="w-full"
                  onClick={() => setFilterByRange((f) => !f)}
                >
                  {filterByRange ? 'Clear Range Filter' : 'Apply Range Filter'}
                </Button>
                {!userDoc?.location && filterByRange && (
                  <p className="text-xs text-muted-foreground">
                    Set your location in Profile to filter by range.
                  </p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{filtered.length} workers</Badge>
          {filterByRange && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" /> Within {radius} km
            </Badge>
          )}
        </div>

        {/* Worker grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Search className="h-10 w-10 opacity-30" />
            <p>No workers found. Try adjusting your search or range filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((worker) => (
              <WorkerCard
                key={worker.uid}
                worker={worker}
                distanceKm={distanceTo(worker)}
                onStartConversation={handleStartConversation}
                onMarkHired={handleMarkHired}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hire confirmation dialog */}
      <Dialog open={!!hireTarget} onOpenChange={() => setHireTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Hired</DialogTitle>
            <DialogDescription>
              You are about to send a hire request to{' '}
              <strong>{hireTarget?.displayName}</strong>. They will be prompted to
              accept or decline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHireTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmHire} disabled={hiring}>
              {hiring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Hire Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}