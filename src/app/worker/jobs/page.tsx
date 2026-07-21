'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { getActiveJobPosts, subscribeToActiveJobPosts } from '@/lib/firestore';
import { hasValidConfig } from '@/lib/firebase';
import { FINNISH_JOB_POSTS } from '@/lib/data';
import { isWithinRange } from '@/lib/utils';
import { EmployeeJobCard } from '@/components/employee/employee-job-card';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getUserDoc, getOrCreateConversation } from '@/lib/firestore';
import type { JobPost } from '@/lib/types';

export default function WorkerJobsPage() {
  const { userDoc } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(userDoc?.searchRadiusKm ?? 50);
  const [filterByRange, setFilterByRange] = useState(false);
  const [creatingConvId, setCreatingConvId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadJobs = async () => {
      if (hasValidConfig) {
        try {
          const activeJobs = await getActiveJobPosts();
          if (active) setJobs(activeJobs);
        } catch (error) {
          console.error(error);
        }
      } else {
        setJobs(FINNISH_JOB_POSTS);
      }
      if (active) setLoading(false);
    };
    loadJobs();

    const unsubscribe = hasValidConfig
      ? subscribeToActiveJobPosts((liveJobs) => {
          if (active) setJobs(liveJobs);
        })
      : undefined;

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.toLowerCase().trim();
    const userLat = userDoc?.location?.lat;
    const userLng = userDoc?.location?.lng;

    return jobs.filter((job) => {
      if (job.status !== 'active') return false;
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.location.address.toLowerCase().includes(query) ||
        job.requirements.some((req) => req.toLowerCase().includes(query));

      const withinRadius =
        !filterByRange ||
        !userLat ||
        !userLng ||
        isWithinRange(userLat, userLng, job.location.lat, job.location.lng, radius);

      return matchesSearch && withinRadius;
    });
  }, [jobs, search, userDoc, filterByRange, radius]);

  const messageEmployer = async (job: JobPost) => {
    if (!userDoc) return;
    setCreatingConvId(job.id);
    try {
      if (!hasValidConfig) {
        const convId = `mock-${job.id}`;
        toast({ title: 'Conversation started', description: `Conversation started with ${job.companyName}.` });
        router.push(`/worker/messages/${convId}`);
        return;
      }
      const employerDoc = await getUserDoc(job.employerId);
      if (!employerDoc) throw new Error('Employer profile not found');
      const { conversationId } = await getOrCreateConversation(
        employerDoc,
        userDoc.uid,
        userDoc.displayName,
        job.id,
        job.title,
      );
      toast({ title: 'Conversation started', description: `Conversation started with ${job.companyName}.` });
      router.push(`/worker/messages/${conversationId}`);
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Unable to start conversation', description: error?.message ?? 'Try again later.' });
    } finally {
      setCreatingConvId(null);
    }
  };

  const handlePingSent = (conversationId: string) => {
    toast({ title: 'Conversation created', description: 'We created a chat with the employer.' });
    router.push(`/worker/messages/${conversationId}`);
  };

  return (
    <div className="px-4 pt-5 pb-24 space-y-4">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">Job Board</h1>
        <p className="text-sm text-muted-foreground">
          Browse active job listings and message employers directly.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, skill or location"
            className="pl-9 h-10 rounded-full"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle>Filter jobs</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Distance</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant={filterByRange ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setFilterByRange(!filterByRange)}
                  >
                    <MapPin className="h-4 w-4" />
                    {filterByRange ? 'Radius on' : 'Radius off'}
                  </Button>
                  <span className="text-sm text-muted-foreground">{radius} km</span>
                </div>
                <Slider
                  value={[radius]}
                  min={10}
                  max={200}
                  step={10}
                  onValueChange={([value]) => setRadius(value)}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <p className="text-sm text-center">No jobs available in your area.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <EmployeeJobCard
              key={job.id}
              job={job}
              onMessageEmployer={messageEmployer}
              onPingSent={handlePingSent}
              busy={creatingConvId === job.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
