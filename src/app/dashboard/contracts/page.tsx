"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getUserContracts, markContractComplete } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Contract } from '@/lib/types';

export default function EmployerContractsPage() {
  const { userDoc } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tab, setTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!userDoc?.uid) { setLoading(false); return; }
      try {
        const res = await getUserContracts(userDoc.uid, 'employer');
        if (active) setContracts(res);
      } catch (err: any) {
        console.error('Failed to load contracts', err);
        toast({ variant: 'destructive', title: 'Failed to load contracts', description: err?.message });
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [userDoc?.uid, toast]);

  const pending = contracts.filter((c) => c.status === 'pending_worker_acceptance');
  const accepted = contracts.filter((c) => c.status === 'active');
  const rejected = contracts.filter((c) => c.status === 'declined');

  const handleMarkComplete = async (id: string) => {
    try {
      await markContractComplete(id);
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'completed' } : c)));
      toast({ title: 'Contract marked complete' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message });
    }
  };

  return (
    <div className="px-4 pt-5 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Contracts</h1>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'pending' ? 'default' : 'outline'} onClick={() => setTab('pending')}>Pending</Button>
        <Button variant={tab === 'accepted' ? 'default' : 'outline'} onClick={() => setTab('accepted')}>Accepted</Button>
        <Button variant={tab === 'rejected' ? 'default' : 'outline'} onClick={() => setTab('rejected')}>Rejected</Button>
      </div>

      {loading ? (
        <div className="py-8">Loading…</div>
      ) : tab === 'pending' ? (
        <div className="space-y-3">
          {pending.length === 0 && <div className="text-sm text-muted-foreground">No pending contracts.</div>}
          {pending.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-sm">{c.jobTitle ?? 'Contract'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">To: {c.workerName ?? c.workerId}</div>
                <div className="mt-2 text-sm">{(c as any).terms ?? (c as any).description ?? ''}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tab === 'accepted' ? (
        <div className="space-y-3">
          {accepted.length === 0 && <div className="text-sm text-muted-foreground">No accepted contracts.</div>}
          {accepted.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-sm">{c.jobTitle ?? 'Contract'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Worker: {c.workerName ?? c.workerId}</div>
                <div className="mt-2 text-sm">{(c as any).terms ?? (c as any).description ?? ''}</div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleMarkComplete(c.id)}>Mark Complete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {rejected.length === 0 && <div className="text-sm text-muted-foreground">No rejected contracts.</div>}
          {rejected.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-sm">{c.jobTitle ?? 'Contract'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Worker: {c.workerName ?? c.workerId}</div>
                <div className="mt-2 text-sm">{(c as any).terms ?? (c as any).description ?? ''}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
