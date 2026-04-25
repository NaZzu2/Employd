'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

const navItems = [
  { href: '/dashboard', icon: Users, label: 'Worker Board', exact: true },
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

  const remaining = userDoc
    ? threadsRemaining(userDoc.subscriptionTier, userDoc.monthlyThreadsStarted)
    : 'unlimited';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1">
          <Logo className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold">Employ&apos;d</span>
          <Badge variant="secondary" className="ml-auto text-xs capitalize">
            {userDoc?.subscriptionTier ?? 'free'}
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
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
