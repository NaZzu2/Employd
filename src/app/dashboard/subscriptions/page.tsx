'use client';
import React, { useEffect, useState } from 'react';
import { Plan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/billing/plans').then((r) => r.json()).then((d) => setPlans(d.plans || [])).catch(() => setPlans([]));
  }, []);

  async function onSelect(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast({ title: 'Subscription updated', description: 'Plan applied (mock).' });
      } else {
        toast({ title: 'Error', description: data.error || 'Unable to create checkout.' });
      }
    } catch (err: any) {
      toast({ title: 'Request failed', description: String(err) });
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Subscription plans</h1>
      <p className="text-muted-foreground">Choose a plan that fits your hiring needs. Mock mode applies immediately.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="p-4 border rounded">
            <h2 className="font-semibold">{p.name}</h2>
            <div className="text-3xl mt-2">{p.price} {p.currency}</div>
            <div className="text-sm text-slate-600 mt-2">{p.monthlyThreads === null ? 'Unlimited threads' : `${p.monthlyThreads} threads / month`}</div>
            <ul className="mt-2 text-sm space-y-1">
              {(p.features || []).map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
            <Button className="mt-4" onClick={() => onSelect(p.id)} disabled={loadingPlan !== null && loadingPlan !== p.id}>
              {p.price === 0 ? 'Select' : 'Upgrade'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
