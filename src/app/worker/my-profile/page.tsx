'use client';

import { useState } from 'react';
import { MapPin, Briefcase, Award, Settings, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WorkerProfileForm } from '@/components/worker/worker-profile-form';
import { StarRatingDisplay } from '@/components/shared/star-rating';
import { BadgeDisplay } from '@/components/shared/badge-display';
import { useAuth } from '@/lib/auth-context';
import { EMPTY_BADGE_COUNTS } from '@/lib/badge-config';
import type { WorkerProfile } from '@/lib/types';

// Mock profile — replaced once Firebase is wired
const MOCK_PROFILE: WorkerProfile = {
  uid: 'mock',
  displayName: 'Alex Martinez',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  title: 'Lead Carpenter',
  location: { lat: 40.68, lng: -73.94, address: 'Brooklyn, NY' },
  summary:
    'Versatile trades professional with 8+ years of experience in commercial and residential settings. Strong focus on quality craftsmanship and safety.',
  skills: ['Finish Carpentry', 'Framing', 'Drywall', 'Blueprint Reading'],
  isLookingForWork: true,
  experience: [
    {
      title: 'Lead Carpenter',
      company: 'BuildRight Contractors',
      duration: '2018 – Present',
      description: 'Led a team of 3 carpenters on residential renovation projects.',
    },
  ],
  education: [
    {
      degree: 'Vocational Certificate in Carpentry',
      institution: 'Brooklyn Technical College',
      year: '2016',
    },
  ],
  averageRating: 4.7,
  reviewCount: 12,
  badgeCounts: { punctual: 5, reliable: 8, quality: 3, professional: 2, goes_above: 1 },
  updatedAt: new Date().toISOString(),
};

export default function WorkerProfilePage() {
  const { userDoc } = useAuth();
  const [profile] = useState<WorkerProfile>(MOCK_PROFILE);
  const [editOpen, setEditOpen] = useState(false);

  const displayProfile = profile;

  return (
    <>
      <div className="px-4 pt-5 pb-4 space-y-5">
        {/* Header card */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-background ring-2 ring-primary/30">
              <AvatarImage src={displayProfile.avatarUrl} />
              <AvatarFallback className="text-2xl font-bold">
                {displayProfile.displayName[0]}
              </AvatarFallback>
            </Avatar>
            {displayProfile.isLookingForWork && (
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-accent border-2 border-background" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-bold">{displayProfile.displayName}</h1>
            <p className="text-sm text-muted-foreground">{displayProfile.title}</p>
            {displayProfile.location && (
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {displayProfile.location.address}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {displayProfile.isLookingForWork ? (
              <Badge className="bg-accent/15 text-accent border-accent/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Looking for Work
              </Badge>
            ) : (
              <Badge variant="secondary">Not looking right now</Badge>
            )}
          </div>

          <StarRatingDisplay
            average={displayProfile.averageRating}
            count={displayProfile.reviewCount}
            size="md"
          />

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <Separator />

        {/* Summary */}
        {displayProfile.summary && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {displayProfile.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {displayProfile.skills.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 pt-0">
              {displayProfile.skills.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Badges */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BadgeDisplay badgeCounts={displayProfile.badgeCounts} />
          </CardContent>
        </Card>

        {/* Experience */}
        {displayProfile.experience.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {displayProfile.experience.map((exp, i) => (
                <div key={i}>
                  <p className="font-semibold text-sm">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.company} · {exp.duration}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                  )}
                  {i < displayProfile.experience.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[90vh] overflow-y-auto pb-8">
          <SheetHeader className="text-left pb-4">
            <SheetTitle>Edit Profile</SheetTitle>
          </SheetHeader>
          <WorkerProfileForm
            profile={displayProfile}
            onSuccess={() => setEditOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
