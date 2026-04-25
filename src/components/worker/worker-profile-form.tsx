'use client';

import { useState } from 'react';
import { Loader2, Save, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updateWorkerProfile, toggleLookingForWork } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { WorkerProfile } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  locationAddress: z.string().min(2, 'Location is required.'),
  summary: z.string().min(10, 'Please write at least 10 characters.'),
});

type FormValues = z.infer<typeof schema>;

interface WorkerProfileFormProps {
  profile: WorkerProfile;
  onSuccess?: () => void;
}

export function WorkerProfileForm({ profile, onSuccess }: WorkerProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [skillInput, setSkillInput] = useState('');
  const [isLooking, setIsLooking] = useState(profile.isLookingForWork);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: profile.title,
      locationAddress: profile.location?.address ?? '',
      summary: profile.summary,
    },
  });

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills((s) => [...s, v]);
    setSkillInput('');
  };

  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const handleToggleLooking = async (val: boolean) => {
    setIsLooking(val);
    try {
      await toggleLookingForWork(profile.uid, val);
    } catch {
      setIsLooking(!val);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await updateWorkerProfile(profile.uid, {
        title: values.title,
        location: profile.location
          ? { ...profile.location, address: values.locationAddress }
          : { lat: 0, lng: 0, address: values.locationAddress },
        summary: values.summary,
        skills,
        isLookingForWork: isLooking,
      });
      toast({ title: 'Profile updated!' });
      onSuccess?.();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to save', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Looking for work toggle */}
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <Label className="font-semibold">Looking for Work</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visible to employers when active — shown first in search
            </p>
          </div>
          <Switch
            checked={isLooking}
            onCheckedChange={handleToggleLooking}
            aria-label="Toggle looking for work status"
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation / Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Licensed Plumber" {...field} />
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
                <Input placeholder="e.g. Brooklyn, NY" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About You</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary of your experience, skills and what you're looking for…"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Skills */}
        <div>
          <Label className="text-sm font-medium">Skills</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill…"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
