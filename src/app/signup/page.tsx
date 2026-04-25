import Image from 'next/image';
import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';
import { Logo } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SignupPage() {
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
              Create an account to get started
            </p>
          </div>
          <SignupForm />
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/" className="underline font-semibold">
              Log in
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
          />
        )}
      </div>
    </div>
  );
}
