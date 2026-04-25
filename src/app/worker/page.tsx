'use client';

import { useState } from 'react';
import { Search, MapPin, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { JobFeedCard } from '@/components/worker/job-feed-card';
import { useAuth } from '@/lib/auth-context';
import { isWithinRange } from '@/lib/utils';
import type { JobPost } from '@/lib/types';

// Mock jobs for UI preview before Firebase connected
const MOCK_JOBS: JobPost[] = [
  {
    id: 'j1',
    employerId: 'emp1',
    employerName: 'AquaFlow Plumbing',
    companyName: 'AquaFlow Plumbing',
    title: 'Licensed Plumber',
    location: { lat: 40.71, lng: -74.01, address: 'New York, NY' },
    type: 'Full-time',
    salary: '$75,000 - $90,000/year',
    description:
      'Seeking a licensed and experienced plumber for residential and commercial projects. Must be proficient in installations, repairs, and maintenance of plumbing systems.',
    requirements: ['Valid plumbing license', '5+ years of experience', 'Own tools'],
    status: 'active',
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'j2',
    employerId: 'emp2',
    employerName: 'SparkSafe Electricals',
    companyName: 'SparkSafe Electricals',
    title: 'Journeyman Electrician',
    location: { lat: 34.05, lng: -118.24, address: 'Los Angeles, CA' },
    type: 'Full-time',
    salary: '$80,000 - $100,000/year',
    description:
      'Join our team of expert electricians. Install and maintain electrical systems in new constructions and existing buildings.',
    requirements: ['Journeyman electrician license', 'Commercial wiring experience'],
    status: 'active',
    postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'j3',
    employerId: 'emp3',
    employerName: 'Precision Woodworks',
    companyName: 'Precision Woodworks',
    title: 'Finish Carpenter',
    location: { lat: 41.87, lng: -87.62, address: 'Chicago, IL' },
    type: 'Contract',
    salary: '$40 - $55/hour',
    description:
      'Looking for a skilled finish carpenter for high-end residential projects. Expertise in trim, molding, and fine woodwork required.',
    requirements: ['Portfolio of finished projects', '5+ years experience'],
    status: 'active',
    postedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'j4',
    employerId: 'emp4',
    employerName: 'ProFinish Painters',
    companyName: 'ProFinish Painters',
    title: 'Commercial Painter',
    location: { lat: 25.77, lng: -80.19, address: 'Miami, FL' },
    type: 'Part-time',
    salary: '$25 - $35/hour',
    description:
      'Seeking a skilled commercial painter for various interior and exterior projects. Knowledge of professional painting techniques required.',
    requirements: ['Proven painting experience', 'Reliable transportation'],
    status: 'active',
    postedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export default function WorkerHomePage() {
  const { userDoc } = useAuth();
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(userDoc?.searchRadiusKm ?? 100);
  const [filterByRange, setFilterByRange] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const userLat = userDoc?.location?.lat;
  const userLng = userDoc?.location?.lng;

  const filtered = MOCK_JOBS.filter((job) => {
    if (job.status !== 'active') return false;

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.companyName.toLowerCase().includes(q) ||
      job.location.address.toLowerCase().includes(q);

    const matchesType = !typeFilter || job.type === typeFilter;

    const matchesRange =
      !filterByRange ||
      !userLat ||
      !userLng ||
      isWithinRange(userLat, userLng, job.location.lat, job.location.lng, radius);

    return matchesSearch && matchesType && matchesRange;
  });

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Job Feed</h1>
            <p className="text-xs text-muted-foreground">
              {filtered.length} jobs near you
            </p>
          </div>

          {/* Filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {(filterByRange || typeFilter) && (
                  <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-accent">
                    {[filterByRange, typeFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-4">
                {/* Job type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Job Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {[null, 'Full-time', 'Part-time', 'Contract'].map((type) => (
                      <button
                        key={type ?? 'all'}
                        onClick={() => setTypeFilter(type)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          typeFilter === type
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        {type ?? 'All Types'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Distance: {radius} km
                  </Label>
                  <Slider
                    min={10}
                    max={500}
                    step={10}
                    value={[radius]}
                    onValueChange={([v]) => setRadius(v)}
                  />
                  <Button
                    variant={filterByRange ? 'destructive' : 'outline'}
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setFilterByRange((f) => !f)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {filterByRange ? 'Clear Range Filter' : 'Filter by Distance'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, companies…"
            className="pl-9 h-9 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Job feed */}
      <div className="px-4 py-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Search className="h-10 w-10 opacity-30" />
            <p className="text-sm">No jobs found. Try adjusting your filters.</p>
          </div>
        ) : (
          filtered.map((job) => <JobFeedCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
