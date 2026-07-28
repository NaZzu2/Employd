'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getJobPost, updateJobPost } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { JobPost } from '@/lib/types';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!id) return;
    getJobPost(id)
      .then(setJob)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!job) return;
    setSaving(true);
    try {
      // Basic validation
      if (!job.title?.trim()) throw new Error('Title is required');
      if (!job.description?.trim()) throw new Error('Description is required');
      if (!job.location?.address?.trim()) throw new Error('Location address is required');

      await updateJobPost(job.id, {
        title: job.title,
        description: job.description,
        salary: job.salary,
        requirements: job.requirements,
        location: job.location,
        // keep type locked (do not allow changing job type here)
        type: job.type,
        status: job.status,
        employerId: job.employerId,
        employerName: job.employerName,
        companyName: job.companyName,
        imageUrl: job.imageUrl,
      });
      toast({ title: 'Job updated successfully!' });
      router.push(`/dashboard/my-jobs/${job.id}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: error?.message ?? 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!job) {
    return <p>Job not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
      <Card>
        <CardHeader><CardTitle>Edit Job</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={job.description} onChange={(e) => setJob({ ...job, description: e.target.value })} rows={5} />
          </div>
          <div className="space-y-2">
            <Label>Salary</Label>
            <Input value={job.salary} onChange={(e) => setJob({ ...job, salary: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Job Type</Label>
            <Input value={job.type} disabled />
          </div>
          <div className="space-y-2">
            <Label>Location Address</Label>
            <Input value={job.location?.address ?? ''} onChange={(e) => setJob({ ...job, location: { ...job.location, address: e.target.value } })} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/my-jobs/${job.id}`)}>Cancel</Button>
        </CardContent>
      </Card>
    </div>
  );
}
