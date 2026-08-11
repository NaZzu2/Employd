"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEmployerProfile } from '@/lib/firestore';
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from '@/lib/auth-context';

// Prevent static prerendering — all dashboard pages require Firebase Auth at runtime
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userDoc } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Enforce onboarding for employers: redirect to setup if employer profile missing
    let active = true;
    const ensureProfile = async () => {
      if (!userDoc) return;
      if (userDoc.role !== 'employer') return;
      try {
        const p = await getEmployerProfile(userDoc.uid);
        if (!active) return;
        if (!p || !p.companyName || !p.companyName.trim()) {
          router.replace('/dashboard/setup');
        }
      } catch (e) {
        // If fetch fails, do not block — sidebar will show setup link
      }
    };
    ensureProfile();
    return () => { active = false; };
  }, [userDoc, router]);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <DashboardHeader />
          <SidebarInset>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
