'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/worker', icon: Home, label: 'Home', exact: true },
  { href: '/worker/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/worker/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/worker/my-profile', icon: User, label: 'Profile' },
];

export function WorkerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t bg-background/95 backdrop-blur-md">
      <div className="flex items-stretch justify-around h-16">
        {tabs.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors',
                active
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-all',
                  active && 'scale-110',
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span>{label}</span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-6 rounded-t-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
