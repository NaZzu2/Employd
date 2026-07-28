"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Clock, Eye, EyeOff, Filter, Loader2, MapPin, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { getEmployerJobPosts, getJobPings, updateJobPostStatus } from '@/lib/firestore';
import { timeAgo } from '@/lib/utils';
import type { JobPost, JobStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type SortMode = 'recent' | 'pings' | 'status';

export default function MyJobsPage() {
  const { userDoc, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [pingCounts, setPingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!userDoc?.uid) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const employerJobs = await getEmployerJobPosts(userDoc.uid);
        setJobs(employerJobs);

        const counts = await Promise.all(
          employerJobs.map(async (job) => [job.id, (await getJobPings(job.id)).length] as const),
        );
        setPingCounts(Object.fromEntries(counts));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userDoc?.uid, authLoading]);

  const handleToggleStatus = async (job: JobPost) => {
    const next = job.status === 'active' ? 'closed' : 'active';
    try {
      await updateJobPostStatus(job.id, next);
      setJobs((prev) => prev.map((item) => (item.id === job.id ? { ...item, status: next } : item)));
      toast({ title: 'Job updated', description: `Listing marked ${next}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message ?? 'Unable to update listing.' });
    }
  };

  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query) ||
        job.location.address.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    return filtered.sort((left, right) => {
      if (sortMode === 'pings') {
        return (pingCounts[right.id] ?? 0) - (pingCounts[left.id] ?? 0);
      }
      if (sortMode === 'status') {
        if (left.status !== right.status) return left.status === 'active' ? -1 : 1;
      }
      return new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime();
    });
  }, [jobs, pingCounts, search, sortMode, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your job postings.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/post-job">
            <Plus className="h-4 w-4" />
            Post a Job
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | JobStatus)}>
          <SelectTrigger>
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="pings">Most Pings</SelectItem>
            <SelectItem value="status">Active Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visibleJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 border rounded-xl">
          <Briefcase className="h-10 w-10 opacity-30" />
          <p>{jobs.length === 0 ? "You haven't posted any jobs yet" : 'No jobs match your filters.'}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/post-job">Post a Job</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleJobs.map((job) => (
            <Card key={job.id} className="flex flex-col transition-colors hover:border-accent/40">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className={job.status === 'active' ? 'bg-accent/15 text-accent border-accent/30' : ''}>
                        {job.status === 'active' ? 'Live' : 'Closed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{job.type}</Badge>
                      <Badge variant="outline" className="text-xs">{pingCounts[job.id] ?? 0} pings</Badge>
                    </div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <CardDescription>{job.companyName}</CardDescription>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/my-jobs/${job.id}`}>View details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/my-jobs/${job.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(job)}>
                        {job.status === 'active' ? (
                          <><EyeOff className="mr-2 h-4 w-4" /> Close listing</>
                        ) : (
                          <><Eye className="mr-2 h-4 w-4" /> Re-open listing</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location.address}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Posted {timeAgo(job.postedAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
