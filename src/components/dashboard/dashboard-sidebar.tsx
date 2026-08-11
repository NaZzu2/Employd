"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Briefcase,
  Users,
  MessageSquare,
  Star,
  User,
  Zap,
  LogOut,
  Bell,
} from 'lucide-react';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { threadsRemaining } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getEmployerProfile } from '@/lib/firestore';

const navItems = [
  { href: '/dashboard', icon: Users, label: 'Dashboard Home', exact: true },
  { href: '/dashboard/workers', icon: Users, label: 'Find Workers' },
  { href: '/dashboard/setup', icon: User, label: 'Setup Profile' },
  { href: '/dashboard/post-job', icon: Briefcase, label: 'Post Job' },
  { href: '/dashboard/contracts', icon: Briefcase, label: 'Contracts' },
  { href: '/dashboard/my-jobs', icon: Briefcase, label: 'My Jobs' },
  { href: '/dashboard/pings', icon: Bell, label: 'Pings' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard/reviews', icon: Star, label: 'Reviews' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userDoc, signOut } = useAuth();

  // Whether the employer still needs to complete setup
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!userDoc || userDoc.role !== 'employer') {
        if (active) setNeedsSetup(null);
        return;
      }
      try {
        const p = await getEmployerProfile(userDoc.uid);
        if (!active) return;
        setNeedsSetup(!p || !p.companyName || !p.companyName.trim());
      } catch (e) {
        if (active) setNeedsSetup(true);
      }
    };
    load();
    return () => { active = false; };
  }, [userDoc?.uid, userDoc?.role]);

  const remaining = userDoc
    ? threadsRemaining(userDoc.subscriptionTier, userDoc.monthlyThreadsStarted)
    : 'unlimited';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu>
          {(() => {
            // Build nav items dynamically so we can conditionally show Setup/Profile
            const base = navItems.filter((i) => i.href !== '/dashboard/setup' && i.href !== '/dashboard/profile');
            // Decide which profile-related item to show for employers
            if (userDoc?.role === 'employer') {
              if (needsSetup) {
                base.splice(2, 0, { href: '/dashboard/setup', icon: User, label: 'Setup Profile' });
              } else {
                base.splice(2, 0, { href: '/dashboard/profile', icon: User, label: 'Profile' });
              }
            } else {
              // default for non-employers: show Profile
              base.splice(2, 0, { href: '/dashboard/profile', icon: User, label: 'Profile' });
            }

            return base.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} className="w-full">
                    <SidebarMenuButton isActive={isActive} tooltip={{ children: item.label }}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            });
          })()}
        </SidebarMenu>
      </SidebarContent>
                  <SidebarMenuButton isActive={isActive} tooltip={{ children: item.label }}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {/* Thread usage indicator */}
        {userDoc?.subscriptionTier === 'free' && (
          <div className="rounded-lg bg-muted px-3 py-2 mx-1 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Zap className="h-3 w-3 text-accent" />
              <span className="font-medium">Monthly threads</span>
            </div>
            <p className="text-xs">
              <span className="font-bold text-foreground">
                {typeof remaining === 'number' ? remaining : '∞'}
              </span>
              {' '}/{' '}
              {10} remaining
            </p>
          </div>
        )}

        <Separator className="my-1" />

        {/* User info */}
        <div className="flex items-center gap-2 px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userDoc?.avatarUrl} alt={userDoc?.displayName} />
            <AvatarFallback>{userDoc?.displayName?.[0] ?? 'E'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left overflow-hidden">
            <p className="font-semibold text-sm truncate">{userDoc?.displayName ?? 'Employer'}</p>
            <p className="text-xs text-muted-foreground truncate">{userDoc?.email ?? ''}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
