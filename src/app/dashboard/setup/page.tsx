'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
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
import { createEmployerProfile, getEmployerProfile } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { EmployerProfile } from '@/lib/types';

const industries = [
  'Construction',
  'Manufacturing',
  'Services',
  'IT',
  'Healthcare',
  'Hospitality',
  'Transportation',
  'Other',
];

export default function EmployerSetupPage() {
  const router = useRouter();
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    description: '',
    location: { lat: 0, lng: 0, address: '' },
    website: '',
    avatarUrl: '',
  });

  // Check if profile already exists, but don't block rendering
  // Just try to redirect if it exists
  useEffect(() => {
    if (!userDoc?.uid) return;
    
    const checkAndRedirect = async () => {
      try {
        // Quick check with 1s timeout
        const result = await Promise.race([
          getEmployerProfile(userDoc.uid),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
        ]);
        
        if (result && typeof result === 'object' && (result as any).companyName) {
          router.replace('/dashboard');
        }
      } catch {
        // Silently fail and let form show
      }
    };
    
    checkAndRedirect();
  }, [userDoc?.uid, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDoc) return;

    // Validate required fields
    if (!formData.companyName.trim()) {
      toast({ variant: 'destructive', title: 'Company name is required' });
      return;
    }
    if (!formData.industry) {
      toast({ variant: 'destructive', title: 'Industry is required' });
      return;
    }
    if (!formData.description.trim()) {
      toast({ variant: 'destructive', title: 'Description is required' });
      return;
    }
    if (!formData.location.address.trim()) {
      toast({ variant: 'destructive', title: 'Location is required' });
      return;
    }

    setLoading(true);
    try {
      await createEmployerProfile(userDoc.uid, {
        uid: userDoc.uid,
        displayName: userDoc.displayName,
        companyName: formData.companyName.trim(),
        industry: formData.industry,
        description: formData.description.trim(),
        location: formData.location,
        website: formData.website.trim() || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        averageRating: 0,
        reviewCount: 0,
        badgeCounts: { punctual: 0, reliable: 0, quality: 0, professional: 0, goes_above: 0 },
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Profile created successfully!',
        description: `Welcome, ${formData.companyName}!`,
      });
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create profile',
        description: error?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Employer Profile</CardTitle>
          <CardDescription>
            Set up your company information so workers can learn about your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., Acme Construction"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Company Description *</Label>
              <Textarea
                id="description"
                placeholder="Tell workers about your company, services, and what makes you special..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                required
              />
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
                  placeholder="e.g., 123 Main St, Helsinki, Finland"
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

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={loading}
              >
                Skip for now
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating profile...
                  </>
                ) : (
                  'Create Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
