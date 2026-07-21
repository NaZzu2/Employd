import type { Metadata } from 'next';
import { EmployeeBottomNav } from '@/components/employee/employee-bottom-nav';

export const metadata: Metadata = {
  title: "Employ'd — Employee App",
  description: 'Search jobs and message employers as an employee.',
};

export const dynamic = 'force-dynamic';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col pb-20 border-x border-border/50">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="mx-auto max-w-lg">
          <EmployeeBottomNav />
        </div>
      </div>
    </div>
  );
}
