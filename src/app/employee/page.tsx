import Link from 'next/link';
import { Briefcase, MessageSquare, Star, User } from 'lucide-react';

export default function EmployeeHomePage() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Employee Hub</h1>
        <p className="text-sm text-muted-foreground">
          Browse Finnish job listings, message employers, and manage your employee profile.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          { href: '/employee/jobs', icon: Briefcase, title: 'Job Board', description: 'Browse active job posts from employers.' },
          { href: '/employee/messages', icon: MessageSquare, title: 'Messages', description: 'View conversations with employers.' },
          { href: '/employee/reviews', icon: Star, title: 'Reviews', description: 'See your reviews and ratings.' },
          { href: '/employee/my-profile', icon: User, title: 'Profile', description: 'Update your employee profile.' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-3xl border border-border p-4 transition hover:border-accent hover:bg-accent/5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
