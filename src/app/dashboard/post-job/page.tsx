'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { createJobPost } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { JobType } from '@/lib/types';

const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Contract'];

export default function PostJobPage() {
  const router = useRouter();
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time' as JobType,
    description: '',
    requirements: [] as string[],
    location: { lat: 0, lng: 0, address: '' },
    salary: '',
    newRequirement: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const addRequirement = () => {
    if (formData.newRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, prev.newRequirement.trim()],
        newRequirement: '',
      }));
    }
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDoc) return;

    // Validate required fields
    if (!formData.title.trim()) {
      toast({ variant: 'destructive', title: 'Job title is required' });
      return;
    }
    if (!formData.description.trim()) {
      toast({ variant: 'destructive', title: 'Description is required' });
      return;
    }
    if (formData.requirements.length === 0) {
      toast({ variant: 'destructive', title: 'At least one requirement is needed' });
      return;
    }
    if (!formData.location.address.trim()) {
      toast({ variant: 'destructive', title: 'Location is required' });
      return;
    }
    if (!formData.salary.trim()) {
      toast({ variant: 'destructive', title: 'Salary information is required' });
      return;
    }

    setLoading(true);
    try {
      await createJobPost({
        employerId: userDoc.uid,
        employerName: userDoc.displayName,
        companyName: userDoc.displayName, // Will be fetched from employerProfiles if available
        title: formData.title.trim(),
        location: formData.location,
        type: formData.type,
        salary: formData.salary.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements,
        status: 'active',
        imageUrl: undefined,
      });
      toast({
        title: 'Job posted successfully!',
        description: 'Your job is now visible to workers.',
      });
      router.push('/dashboard/my-jobs');
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to post job',
        description: error?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <CardDescription>Fill out the form to create a new job listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Electrician"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            {/* Job Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Job Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the job, responsibilities, and what you're looking for..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={5}
                required
              />
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <Label>Requirements *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a requirement (e.g., 5+ years experience)"
                  value={formData.newRequirement}
                  onChange={(e) => handleChange('newRequirement', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRequirement();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addRequirement} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.requirements.length > 0 && (
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                      <span className="text-sm">{req}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4">
              <Label>Location *</Label>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm">
                  Address
                </Label>
                <Input
                  id="address"
                  placeholder="e.g., Helsinki, Finland"
                  value={formData.location.address}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat" className="text-sm">
                    Latitude
                  </Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.0001"
                    placeholder="60.1699"
                    value={formData.location.lat || ''}
                    onChange={(e) => handleLocationChange('lat', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng" className="text-sm">
                    Longitude
                  </Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.0001"
                    placeholder="24.9384"
                    value={formData.location.lng || ''}
                    onChange={(e) => handleLocationChange('lng', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Salary */}
            <div className="space-y-2">
              <Label htmlFor="salary">Salary / Pay *</Label>
              <Input
                id="salary"
                placeholder="e.g., €30-40/hour or €50,000-60,000/year"
                value={formData.salary}
                onChange={(e) => handleChange('salary', e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting job...
                  </>
                ) : (
                  'Post Job'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
