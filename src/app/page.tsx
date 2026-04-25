import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((p) => p.id === 'login-hero');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="mx-auto grid w-full max-w-sm gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Logo className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">Employ&apos;d</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Login to find your next opportunity
            </p>
          </div>
          <LoginForm />
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline font-semibold">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            data-ai-hint={loginImage.imageHint}
            width={1200}
            height={1800}
            className="h-screen w-full object-cover dark:brightness-[0.3]"
            priority
          />
        )}
      </div>
    </div>
  );
}
