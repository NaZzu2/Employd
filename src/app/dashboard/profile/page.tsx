"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createEmployerProfile, getEmployerProfile, updateEmployerProfile } from '@/lib/firestore';
import { hasValidConfig } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { EmployerProfile } from '@/lib/types';
import { THREAD_LIMITS } from '@/lib/types';

export default function ProfilePage() {
    const { userDoc } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<EmployerProfile | null>(null);
    const [isEditMode, setIsEditMode] = useState(true);

    useEffect(() => {
        if (!userDoc?.uid) return;

        const load = async () => {
            try {
                if (!hasValidConfig) {
                    setLoading(false);
                    return;
                }
                const employerProfile = await getEmployerProfile(userDoc.uid);
                const normalize = (p: Partial<EmployerProfile> | null): EmployerProfile | null => {
                    if (!p) return null;
                    return {
                        uid: p.uid || userDoc.uid,
                        displayName: p.displayName || userDoc.displayName || '',
                        companyName: p.companyName || '',
                        industry: p.industry || '',
                        description: p.description || '',
                        location: p.location || { lat: 0, lng: 0, address: '' },
                        website: p.website || undefined,
                        avatarUrl: p.avatarUrl || undefined,
                        averageRating: typeof p.averageRating === 'number' ? p.averageRating : 0,
                        reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
                        badgeCounts: p.badgeCounts || { punctual: 0, reliable: 0, quality: 0, professional: 0, goes_above: 0 },
                        updatedAt: p.updatedAt || new Date().toISOString(),
                    } as EmployerProfile;
                };

                if (!employerProfile) {
                    // No profile yet — switch to create mode and prefill a minimal profile object
                    setIsEditMode(false);
                    setProfile(normalize({ uid: userDoc.uid, displayName: userDoc.displayName }));
                } else {
                    setProfile(normalize(employerProfile));
                    setIsEditMode(true);
                }
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [router, userDoc?.uid]);

    const handleSave = async () => {
        if (!userDoc || !profile) return;
        setSaving(true);
        try {
            if (!hasValidConfig) {
                toast({ title: 'Mock mode', description: 'Profile updates are disabled without Firebase.' });
                return;
            }
            if (isEditMode) {
                await updateEmployerProfile(userDoc.uid, profile);
                toast({ title: 'Profile updated successfully!' });
            } else {
                // Create new profile
                await createEmployerProfile(userDoc.uid, profile);
                toast({ title: 'Profile created successfully!' });
                setIsEditMode(true);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: isEditMode ? 'Failed to update profile' : 'Failed to create profile', description: error?.message ?? 'Try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading || !profile) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Employer Profile</h1>
                <p className="text-muted-foreground">Manage the company information workers see.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Update your public employer profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Industry</Label>
                            <Input value={profile.industry} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} rows={5} />
                    </div>

                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                            value={profile.location.address}
                            onChange={(e) => setProfile({ ...profile, location: { ...profile.location, address: e.target.value } })}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                                type="number"
                                value={profile.location.lat}
                                onChange={(e) => setProfile({ ...profile, location: { ...profile.location, lat: Number(e.target.value) || 0 } })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                                type="number"
                                value={profile.location.lng}
                                onChange={(e) => setProfile({ ...profile, location: { ...profile.location, lng: Number(e.target.value) || 0 } })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Website</Label>
                        <Input value={profile.website ?? ''} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Plan: {userDoc?.subscriptionTier ?? 'free'}</Badge>
                        <Badge variant="outline">
                          {userDoc?.monthlyThreadsStarted ?? 0} / {THREAD_LIMITS[userDoc?.subscriptionTier ?? 'free'] === Infinity ? '∞' : THREAD_LIMITS[userDoc?.subscriptionTier ?? 'free']} conversations used this month
                        </Badge>
                        <Badge variant="outline">Ratings: {profile.averageRating.toFixed(1)} / {profile.reviewCount}</Badge>
                    </div>

                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditMode ? 'Save Changes' : 'Create Profile'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {profile.location.address}
                    </div>
                    <p>{profile.description}</p>
                </CardContent>
            </Card>
        </div>
    );
}
