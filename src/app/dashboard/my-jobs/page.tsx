'use client';

import { useState } from 'react';
import { Plus, Briefcase, MapPin, Clock, DollarSign, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobPostForm } from '@/components/dashboard/job-post-form';
import { useAuth } from '@/lib/auth-context';
import { updateJobPostStatus } from '@/lib/firestore';
import { timeAgo } from '@/lib/utils';
import type { JobPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Mock data for UI preview before Firebase
const MOCK_JOBS: JobPost[] = [
  {
    id: 'j1',
    employerId: 'mock',
    employerName: 'AquaFlow Plumbing',
    companyName: 'AquaFlow Plumbing',
    title: 'Licensed Plumber',
    location: { lat: 40.71, lng: -74.01, address: 'New York, NY' },
    type: 'Full-time',
    salary: '$75,000 - $90,000/year',
    description: 'Seeking a licensed plumber for residential and commercial projects.',
    requirements: ['Valid plumbing license', '5+ years of experience'],
    status: 'active',
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export default function MyJobsPage() {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>(MOCK_JOBS);
  const [showForm, setShowForm] = useState(false);

  const handleToggleStatus = async (job: JobPost) => {
    const next = job.status === 'active' ? 'closed' : 'active';
    try {
      await updateJobPostStatus(job.id, next);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: next } : j)),
      );
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleJobCreated = (job: JobPost) => {
    setJobs((prev) => [job, ...prev]);
    setShowForm(false);
    toast({ title: 'Job posted!', description: `"${job.title}" is now live.` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your job postings.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Post a Job
        </Button>
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Briefcase className="h-10 w-10 opacity-30" />
          <p>No job posts yet. Create your first listing!</p>
          <Button onClick={() => setShowForm(true)} variant="outline">
            Post a Job
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
                      <Badge
                        variant={job.status === 'active' ? 'default' : 'secondary'}
                        className={
                          job.status === 'active'
                            ? 'bg-accent/15 text-accent border-accent/30'
                            : ''
                        }
                      >
                        {job.status === 'active' ? 'Live' : 'Closed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {job.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <CardDescription>{job.companyName}</CardDescription>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(job)}>
                        {job.status === 'active' ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" /> Close listing
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" /> Re-open listing
                          </>
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
                  <DollarSign className="h-3.5 w-3.5" />
                  {job.salary}
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

      {/* Job post form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a New Job</DialogTitle>
          </DialogHeader>
          {userDoc && (
            <JobPostForm
              employer={userDoc}
              onSuccess={handleJobCreated}
              onCancel={() => setShowForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
