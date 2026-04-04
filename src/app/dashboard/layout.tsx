import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider, SidebarInset, Sidebar } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <div className="min-h-screen w-full flex">
            <DashboardSidebar />
            <div className="flex flex-1 flex-col">
                <DashboardHeader />
                <SidebarInset>
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </div>
    </SidebarProvider>
  );
}
