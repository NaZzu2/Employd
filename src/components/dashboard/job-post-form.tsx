'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createJobPost } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { JobPost, JobType, UserDoc } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters.'),
  companyName: z.string().min(2, 'Company name is required.'),
  locationAddress: z.string().min(3, 'Location is required.'),
  type: z.enum(['Full-time', 'Part-time', 'Contract']),
  salary: z.string().min(1, 'Please specify a salary or pay rate.'),
  description: z.string().min(20, 'Please provide at least 20 characters.'),
});

type FormValues = z.infer<typeof schema>;

interface JobPostFormProps {
  employer: UserDoc;
  onSuccess?: (job: JobPost) => void;
  onCancel?: () => void;
}

export function JobPostForm({ employer, onSuccess, onCancel }: JobPostFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      companyName: '',
      locationAddress: '',
      type: 'Full-time',
      salary: '',
      description: '',
    },
  });

  const addReq = () => {
    const v = reqInput.trim();
    if (v && !requirements.includes(v)) {
      setRequirements((r) => [...r, v]);
    }
    setReqInput('');
  };

  const removeReq = (r: string) => setRequirements((prev) => prev.filter((x) => x !== r));

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Geocode address (mock coordinates for boilerplate)
      const location = {
        lat: employer.location?.lat ?? 0,
        lng: employer.location?.lng ?? 0,
        address: values.locationAddress,
      };

      const id = await createJobPost({
        employerId: employer.uid,
        employerName: employer.displayName,
        companyName: values.companyName,
        title: values.title,
        location,
        type: values.type as JobType,
        salary: values.salary,
        description: values.description,
        requirements,
        status: 'active',
      });

      const job: JobPost = {
        id,
        ...values,
        type: values.type as JobType,
        location,
        employerId: employer.uid,
        employerName: employer.displayName,
        requirements,
        status: 'active',
        postedAt: new Date().toISOString(),
      };

      onSuccess?.(job);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to post job', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Licensed Plumber" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. AquaFlow Plumbing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="locationAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. New York, NY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Salary / Pay Rate</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. $75,000 - $90,000/year or $40/hr" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role, responsibilities, and work environment…"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Requirements */}
        <div>
          <FormLabel>Requirements</FormLabel>
          <div className="flex gap-2 mt-1">
            <Input
              value={reqInput}
              onChange={(e) => setReqInput(e.target.value)}
              placeholder="e.g. 5+ years experience"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReq())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addReq}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {requirements.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {requirements.map((r) => (
                <Badge key={r} variant="secondary" className="gap-1">
                  {r}
                  <button type="button" onClick={() => removeReq(r)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Post Job
          </Button>
        </div>
      </form>
    </Form>
  );
}
