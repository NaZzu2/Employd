'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import WorkerProfileReadOnly from '@/components/dashboard/worker-profile-readonly';

export default function WorkerPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <WorkerProfileReadOnly workerId={id} />
    </div>
  );
}
