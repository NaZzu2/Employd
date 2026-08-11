"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { workerRespondToContract, addContractMessage, subscribeToUserContracts } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Contract } from '@/lib/types';

export default function WorkerContractsPage() {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  // Reject flow
  const [rejectTarget, setRejectTarget] = useState<Contract | null>(null);
  const [rejectMessage, setRejectMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userDoc?.uid) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToUserContracts(userDoc.uid, 'worker', (cs) => {
      setContracts(cs);
      setLoading(false);
    });
    return () => unsub();
  }, [userDoc?.uid]);

  const pending = contracts.filter((c) => c.status === 'pending_worker_acceptance');
  const completed = contracts.filter((c) => c.status !== 'pending_worker_acceptance');

  const handleAccept = async (id: string) => {
    if (!userDoc) return;
    setSubmitting(true);
    try {
      await workerRespondToContract(id, true);
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'active' } : c)));
      toast({ title: 'Contract accepted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message });
    } finally { setSubmitting(false); }
  };

  const handleReject = (c: Contract) => {
    setRejectTarget(c);
    setRejectMessage('');
  };

  const confirmReject = async () => {
    if (!userDoc || !rejectTarget) return;
    setSubmitting(true);
    try {
      await workerRespondToContract(rejectTarget.id, false);
      if (rejectMessage.trim()) {
        await addContractMessage(rejectTarget.id, userDoc.uid, rejectMessage.trim());
      }
      setContracts((prev) => prev.map((c) => (c.id === rejectTarget.id ? { ...c, status: 'declined' } : c)));
      toast({ title: 'Contract rejected' });
      setRejectTarget(null);
      setRejectMessage('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message });
    } finally { setSubmitting(false); }
  };

  if (!userDoc) return <div className="p-4">Please sign in to view contracts.</div>;

  return (
    <div className="px-4 pt-5 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Contracts</h1>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'pending' ? 'default' : 'outline'} onClick={() => setTab('pending')}>Pending</Button>
        <Button variant={tab === 'completed' ? 'default' : 'outline'} onClick={() => setTab('completed')}>Completed</Button>
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
                <div className="text-sm text-muted-foreground">From: {c.employerName ?? c.employerId}</div>
                <div className="mt-2 text-sm">{(c as any).terms ?? (c as any).description ?? ''}</div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleAccept(c.id)} disabled={submitting}>Accept</Button>
                  <Button variant="outline" onClick={() => handleReject(c)} disabled={submitting}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {completed.length === 0 && <div className="text-sm text-muted-foreground">No completed contracts.</div>}
          {completed.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-sm">{c.jobTitle ?? 'Contract'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">From: {c.employerName ?? c.employerId}</div>
                <div className="mt-2 text-sm">{(c as any).terms ?? (c as any).description ?? ''}</div>
                <div className="mt-3 text-xs text-muted-foreground">Status: {c.status}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg p-4 w-full max-w-md">
            <h3 className="font-semibold">Reject Contract</h3>
            <p className="text-sm text-muted-foreground mt-1">Optionally send a short message back to the employer explaining the rejection.</p>
            <div className="mt-3">
              <Textarea value={rejectMessage} onChange={(e) => setRejectMessage(e.target.value)} rows={4} />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectMessage(''); }} disabled={submitting}>Cancel</Button>
              <Button onClick={confirmReject} disabled={submitting}>Send & Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
