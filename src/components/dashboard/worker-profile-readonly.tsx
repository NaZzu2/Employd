'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWorkerProfile } from '@/lib/firestore';
import type { WorkerProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function WorkerProfileReadOnly({ workerId, compact }: { workerId: string; compact?: boolean }) {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getWorkerProfile(workerId)
      .then((w) => { if (mounted) setWorker(w); })
      .catch((e) => console.error('getWorkerProfile', e))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [workerId]);

  if (loading) return (
    <div className="flex items-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Loading profile…</span>
    </div>
  );

  if (!worker) return <div className="text-sm text-muted-foreground">Worker profile not found.</div>;

  return (
    <Card className={compact ? 'p-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {worker.avatarUrl ? <AvatarImage src={worker.avatarUrl} /> : <AvatarFallback>{worker.displayName?.[0]}</AvatarFallback>}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{worker.displayName}</span>
            <span className="text-sm text-muted-foreground">{worker.title}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-muted-foreground">{worker.summary}</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {worker.skills?.slice(0, 8).map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          <div>Rating: <span className="font-semibold">{worker.averageRating?.toFixed(1) ?? '0.0'}</span> · {worker.reviewCount ?? 0} reviews</div>
        </div>
      </CardContent>
    </Card>
  );
}
