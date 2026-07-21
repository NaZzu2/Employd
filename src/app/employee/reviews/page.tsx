'use client';

import { Star } from 'lucide-react';

export default function EmployeeReviewsPage() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Your ratings and feedback history.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <p className="mb-3 font-semibold">Coming soon</p>
        <p>Employer reviews and ratings will be displayed here once you start receiving feedback from conversations and completed work.</p>
      </div>
    </div>
  );
}
