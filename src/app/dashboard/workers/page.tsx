'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAllWorkerProfiles, getEmployerProfile, startConversation } from '@/lib/firestore';
import { haversineDistanceKm } from '@/lib/utils';
import { WorkerCard } from '@/components/dashboard/worker-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { WorkerProfile, EmployerProfile } from '@/lib/types';
import type { GeoLocation } from '@/lib/types';

const RADIUS_OPTIONS = [10, 25, 50, 100, 250, 500];

export default function WorkersPage() {
  const { userDoc, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagingWorkerId, setMessagingWorkerId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(100);
  const [useRadiusFilter, setUseRadiusFilter] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userDoc?.uid) { setLoading(false); return; }

    const load = async () => {
      try {
        const [allWorkers, profile] = await Promise.all([
          getAllWorkerProfiles(),
          getEmployerProfile(userDoc.uid).catch(() => null),
        ]);
        setWorkers(allWorkers);
        setEmployerProfile(profile);
      } catch (err: any) {
        console.error('[Workers] Load error:', err);
        toast({ variant: 'destructive', title: 'Failed to load workers', description: err?.message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userDoc?.uid, authLoading, toast]);

  // All unique skills across the pool
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((w) => w.skills.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [workers]);

  const employerLocation: GeoLocation | undefined = employerProfile?.location;

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (availableOnly && !w.isLookingForWork) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = w.displayName.toLowerCase().includes(q);
        const matchTitle = w.title?.toLowerCase().includes(q);
        const matchSkill = w.skills.some((s) => s.toLowerCase().includes(q));
        const matchSummary = w.summary?.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchSkill && !matchSummary) return false;
      }

      if (selectedSkills.length > 0) {
        const workerSkillSet = new Set(w.skills.map((s) => s.toLowerCase()));
        const hasAll = selectedSkills.every((s) => workerSkillSet.has(s.toLowerCase()));
        if (!hasAll) return false;
      }

      if (useRadiusFilter && employerLocation && w.location) {
        const dist = haversineDistanceKm(
          employerLocation.lat, employerLocation.lng,
          w.location.lat, w.location.lng,
        );
        if (dist > radiusKm) return false;
      }

      return true;
    });
  }, [workers, search, selectedSkills, radiusKm, useRadiusFilter, availableOnly, employerLocation]);

  const getDistance = (worker: WorkerProfile): number | undefined => {
    if (!employerLocation || !worker.location) return undefined;
    return haversineDistanceKm(
      employerLocation.lat, employerLocation.lng,
      worker.location.lat, worker.location.lng,
    );
  };

  const handleStartConversation = async (worker: WorkerProfile) => {
    if (!userDoc) return;
    setMessagingWorkerId(worker.uid);
    try {
      const convId = await startConversation(
        userDoc,
        worker.uid,
        worker.displayName,
      );
      router.push(`/dashboard/messages/${convId}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Could not start conversation', description: err?.message });
    } finally {
      setMessagingWorkerId(null);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Find Workers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse {workers.length} worker{workers.length !== 1 ? 's' : ''} in the pool
            {filtered.length !== workers.length && ` · ${filtered.length} match your filters`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, title, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Available only toggle */}
          <div className="flex items-center gap-2">
            <Switch id="available" checked={availableOnly} onCheckedChange={setAvailableOnly} />
            <Label htmlFor="available" className="cursor-pointer">Available for work only</Label>
          </div>

          {/* Radius filter */}
          <div className="flex items-center gap-2">
            <Switch id="radius" checked={useRadiusFilter} onCheckedChange={setUseRadiusFilter} />
            <Label htmlFor="radius" className="cursor-pointer">Radius filter</Label>
          </div>
        </div>

        {/* Radius slider */}
        {useRadiusFilter && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Max distance</Label>
              <span className="text-sm font-semibold text-accent">{radiusKm} km</span>
            </div>
            <Slider
              min={10}
              max={500}
              step={10}
              value={[radiusKm]}
              onValueChange={([v]) => setRadiusKm(v)}
              className="w-full"
            />
            {!employerLocation && (
              <p className="text-xs text-amber-600">
                Add your company location in{' '}
                <a href="/dashboard/setup" className="underline">profile setup</a>{' '}
                to enable distance filtering.
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map((km) => (
                <Button
                  key={km}
                  size="sm"
                  variant={radiusKm === km ? 'default' : 'outline'}
                  className="h-7 text-xs px-2"
                  onClick={() => setRadiusKm(km)}
                >
                  {km} km
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Skill chips */}
        {allSkills.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Filter by skill</Label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {allSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs hover:bg-primary/10 select-none"
                  onClick={() => toggleSkill(skill)}
                >
                  {selectedSkills.includes(skill) && <X className="h-2.5 w-2.5 mr-1" />}
                  {skill}
                </Badge>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedSkills([])}>
                Clear skill filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 border rounded-xl">
          <Users className="h-10 w-10 opacity-30" />
          <p className="font-medium">No workers match your filters</p>
          <p className="text-sm text-center max-w-xs">
            Try widening the radius, removing skill filters, or turning off the "available only" toggle.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedSkills([]);
              setAvailableOnly(false);
              setUseRadiusFilter(false);
            }}
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((worker) => (
            <WorkerCard
              key={worker.uid}
              worker={worker}
              distanceKm={getDistance(worker)}
              onStartConversation={handleStartConversation}
              messagingLoading={messagingWorkerId === worker.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
