"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, MessageSquare, MapPin, Bell, Loader2, Plus, UserRound, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getEmployerProfile, getEmployerJobPosts, getEmployerPings, getUserConversations, getWorkersLookingForWork } from '@/lib/firestore';
import { hasValidConfig } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { EmployerProfile, JobPost, Conversation, Ping, WorkerProfile } from '@/lib/types';

// ─── Mock data (used when Firebase is not configured) ────────────────────────
const MOCK_WORKERS: WorkerProfile[] = [
  {
    uid: 'mock-1',
    displayName: 'Alex Martinez',
    title: 'Lead Carpenter',
    summary: 'Versatile trades professional with 8+ years in commercial and residential settings.',
    skills: ['Finish Carpentry', 'Framing', 'Drywall', 'Blueprint Reading'],
    isLookingForWork: true,
    averageRating: 4.7,
    reviewCount: 12,
    badgeCounts: { punctual: 5, reliable: 8, quality: 3, professional: 2, goes_above: 1 },
    location: { lat: 40.68, lng: -73.94, address: 'Brooklyn, NY' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'mock-2',
    displayName: 'Sam Rivera',
    title: 'Journeyman Electrician',
    summary: 'Licensed electrician with expertise in commercial wiring and solar installations.',
    skills: ['Commercial Wiring', 'Solar Panels', 'Blueprints', 'Safety Compliance'],
    isLookingForWork: true,
    averageRating: 4.9,
    reviewCount: 7,
    badgeCounts: { punctual: 7, reliable: 6, quality: 5, professional: 4, goes_above: 2 },
    location: { lat: 34.05, lng: -118.24, address: 'Los Angeles, CA' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'mock-3',
    displayName: 'Jordan Kim',
    title: 'Certified Welder',
    summary: 'AWS-certified welder specializing in MIG, TIG and structural steel fabrication.',
    skills: ['MIG Welding', 'TIG Welding', 'Structural Steel', 'Fabrication'],
    isLookingForWork: false,
    averageRating: 4.2,
    reviewCount: 5,
    badgeCounts: { punctual: 2, reliable: 3, quality: 4, professional: 1, goes_above: 0 },
    location: { lat: 29.76, lng: -95.37, address: 'Houston, TX' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
  // Finnish test users (suomi)
  {
    uid: 'fi-1',
    displayName: 'Mikko Virtanen',
    title: 'Kirvesmies',
    summary: 'Ammattitaitoinen kirvesmies, erikoistunut huoneistoremontteihin ja viimeistelytöihin.',
    skills: ['Sisätyöt', 'Kalusteasennus', 'Viimeistely', 'Mittatyöt'],
    isLookingForWork: true,
    averageRating: 4.8,
    reviewCount: 9,
    badgeCounts: { punctual: 4, reliable: 6, quality: 5, professional: 2, goes_above: 1 },
    location: { lat: 60.1699, lng: 24.9384, address: 'Helsinki, Suomi' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'fi-2',
    displayName: 'Laura Laine',
    title: 'Sähköasentaja',
    summary: 'Sertifioitu sähköasentaja, kokemus teollisuus- ja talotekniikkatöistä.',
    skills: ['Sähköasennus', 'Vianetsintä', 'Aurinkosähkö', 'Turvallisuus'],
    isLookingForWork: true,
    averageRating: 4.9,
    reviewCount: 5,
    badgeCounts: { punctual: 3, reliable: 4, quality: 3, professional: 3, goes_above: 0 },
    location: { lat: 61.9241, lng: 25.7482, address: 'Suomi' },
    experience: [],
    education: [],
    updatedAt: new Date().toISOString(),
  },
];

export default function DashboardPage() {
    const { userDoc } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<EmployerProfile | null>(null);
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [pings, setPings] = useState<Ping[]>([]);
    const [availableWorkerCount, setAvailableWorkerCount] = useState<number | null>(null);

    useEffect(() => {
      if (!userDoc?.uid) {
        // If auth is done loading and still no user, stop loading
        setLoading(false);
        return;
      }

      const load = async () => {
        try {
          if (!hasValidConfig) {
            setLoading(false);
            return;
          }

          console.log('[Dashboard] Loading for user:', userDoc.uid);
          
          // Create a timeout promise  
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Dashboard load timeout - check your Firestore connection')),
              5000 // 5 second timeout
            )
          );

          try {
            const employerProfile = await Promise.race([
              getEmployerProfile(userDoc.uid),
              timeoutPromise as any,
            ]);
            
            console.log('[Dashboard] Employer profile:', employerProfile);
            
            if (employerProfile) {
              // Profile exists - load all data
              const [jobPosts, employerConversations, employerPings, availableWorkers] = await Promise.all([
                getEmployerJobPosts(userDoc.uid).catch(() => []),
                getUserConversations(userDoc.uid, 'employer').catch(() => []),
                getEmployerPings(userDoc.uid).catch(() => []),
                getWorkersLookingForWork().catch(() => []),
              ]);

              setProfile(employerProfile);
              setJobs(jobPosts);
              setConversations(employerConversations);
              setPings(employerPings);
              setAvailableWorkerCount(availableWorkers.length);
            }
          } catch (error: any) {
            if (error.message?.includes('timeout')) {
              console.warn('[Dashboard] Profile fetch timed out, allowing continued access');
              // Don't fail - just continue without full data
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          console.error('[Dashboard] Error:', error);
          // Don't show toast for non-critical errors, just log them
          console.error('[Dashboard] Will render with limited data:', error?.message);
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [userDoc?.uid]);

    const stats = useMemo(() => {
      const activeJobs = jobs.filter((job) => job.status === 'active').length;
      const unreadMessages = conversations.filter((conversation) => conversation.lastMessageSeen === false).length;
      const pendingPings = pings.filter((ping) => ping.status === 'pending').length;

      return { activeJobs, unreadMessages, pendingPings };
    }, [jobs, conversations, pings]);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      );
    }

    // Show setup prompt if no profile, but don't block everything
    if (!profile) {
      return (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-900 font-semibold mb-3">Complete Your Employer Profile</p>
            <p className="text-amber-800 text-sm mb-4">
              To start posting jobs and managing your hiring, please complete your employer profile setup.
            </p>
            <Button asChild>
              <Link href="/dashboard/setup">Go to Profile Setup</Link>
            </Button>
          </div>

          {/* Still show empty stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Jobs</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Jobs currently visible to workers.</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Unread Messages</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Conversations waiting for your reply.</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Pings</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Workers interested in your jobs.</CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {profile?.companyName ?? userDoc?.displayName ?? 'Employer'}</h1>
            <p className="text-muted-foreground">Manage your company profile, job posts, pings, and conversations.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">
                <UserRound className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/post-job">
                <Plus className="mr-2 h-4 w-4" />
                Post Job
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Jobs</CardDescription>
              <CardTitle className="text-3xl">{stats.activeJobs}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Jobs currently visible to workers.</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unread Messages</CardDescription>
              <CardTitle className="text-3xl">{stats.unreadMessages}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Conversations waiting for your reply.</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Pings</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingPings}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Workers interested in your jobs.</CardContent>
          </Card>
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Available Workers</CardDescription>
              <CardTitle className="text-3xl">{availableWorkerCount ?? '—'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/workers" className="text-sm text-accent underline underline-offset-2">
                Browse worker pool →
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Your public employer profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback>{profile?.companyName?.[0] ?? 'E'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile?.companyName}</p>
                  <p className="text-sm text-muted-foreground">{profile?.industry}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{profile?.description}</p>
              {profile?.location?.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profile.location.address}
                </div>
              )}
              <Badge variant="secondary">{userDoc?.subscriptionTier ?? 'free'} plan</Badge>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump to the most common employer workflows</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard/workers">
                  <Users className="mr-2 h-4 w-4" />
                  Find Workers
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard/my-jobs">
                  <Briefcase className="mr-2 h-4 w-4" />
                  View My Jobs
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Messages
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard/pings">
                  <Bell className="mr-2 h-4 w-4" />
                  View Pings
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard/profile">
                  <UserRound className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
              <CardTitle>Recent Pings</CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                  <Link href="/dashboard/pings">View all</Link>
                </Button>
              </div>
              <CardDescription>Workers interested in your jobs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pings.slice(0, 5).map((ping) => (
                <div key={ping.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{ping.workerName}</p>
                    <p className="text-sm text-muted-foreground">{ping.jobTitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ping.status}</Badge>
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                      <Link href="/dashboard/pings">View worker</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {pings.length === 0 && <p className="text-sm text-muted-foreground">No pings yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Conversation overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations.slice(0, 5).map((conversation) => (
                <Link key={conversation.id} href={`/dashboard/messages/${conversation.id}`} className="block rounded-lg border p-3 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{conversation.workerName}</p>
                    <span className="text-xs text-muted-foreground">{conversation.lastMessageAt}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage || 'No messages yet'}</p>
                </Link>
              ))}
              {conversations.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/worker/jobs">Preview worker job board</Link>
          </Button>
        </div>
      </div>
    );
}