import type { Metadata } from 'next';
import { WorkerBottomNav } from '@/components/worker/worker-bottom-nav';

export const metadata: Metadata = {
  title: "Employ'd — Worker App",
  description: 'Find your next job opportunity.',
};

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Constrain to phone width on desktop, full width on mobile */}
      <div className="mx-auto max-w-lg min-h-screen flex flex-col pb-20 border-x border-border/50">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Bottom nav — sticky to viewport bottom */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="mx-auto max-w-lg">
          <WorkerBottomNav />
        </div>
      </div>
    </div>
  );
}
