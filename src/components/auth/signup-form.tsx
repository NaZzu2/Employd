'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, User, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Please enter your full name.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

type SignupFormValues = z.infer<typeof formSchema>;

export function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('worker');

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      await signUp(values.email, values.password, values.name, role);
      router.push(role === 'employer' ? '/dashboard' : '/worker');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: err.message ?? 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Role selector */}
      <div>
        <p className="text-sm font-medium mb-3 text-center text-muted-foreground">I am a…</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('worker')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all',
              role === 'worker'
                ? 'border-accent bg-accent/10 text-accent-foreground'
                : 'border-border hover:border-muted-foreground',
            )}
          >
            <User className="h-6 w-6" />
            <span>Worker</span>
            <span className="text-xs text-muted-foreground font-normal">Looking for work</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('employer')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all',
              role === 'employer'
                ? 'border-accent bg-accent/10 text-accent-foreground'
                : 'border-border hover:border-muted-foreground',
            )}
          >
            <Building2 className="h-6 w-6" />
            <span>Employer</span>
            <span className="text-xs text-muted-foreground font-normal">Hiring workers</span>
          </button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create account as {role === 'employer' ? 'Employer' : 'Worker'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
