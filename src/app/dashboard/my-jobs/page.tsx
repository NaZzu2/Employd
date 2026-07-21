"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, MapPin, Clock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';
import { getEmployerJobPosts, updateJobPostStatus } from '@/lib/firestore';
import { timeAgo } from '@/lib/utils';
import type { JobPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function MyJobsPage() {
  const { userDoc, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userDoc?.uid) { setLoading(false); return; }
    getEmployerJobPosts(userDoc.uid)
      .then(setJobs)
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 border rounded-xl">
          <Briefcase className="h-10 w-10 opacity-30" />
          <p>No job posts yet. Create your first listing!</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/post-job">Post a Job</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className={job.status === 'active' ? 'bg-accent/15 text-accent border-accent/30' : ''}>
                        {job.status === 'active' ? 'Live' : 'Closed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{job.type}</Badge>
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
                          <><EyeOff className="h-4 w-4 mr-2" /> Close listing</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" /> Re-open listing</>
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
