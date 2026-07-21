'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function EmployeeProfilePage() {
  const { userDoc } = useAuth();
  const [profile, setProfile] = useState(userDoc);

  useEffect(() => {
    setProfile(userDoc);
  }, [userDoc]);

  if (!profile) {
    return (
      <div className="px-4 pt-6 pb-24 text-muted-foreground">
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-xl">{profile.displayName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">Employee</p>
        </div>
      </div>
      <Card className="rounded-3xl border border-border bg-card">
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p>{profile.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subscription tier</p>
            <Badge variant="secondary">{profile.subscriptionTier}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Search radius</p>
            <p>{profile.searchRadiusKm} km</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
