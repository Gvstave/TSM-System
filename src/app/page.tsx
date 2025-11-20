
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function LandingPage() {
  return (
    <section className="flex-1 flex items-center justify-center text-center p-4">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
          Task Management & Scheduling System
        </h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
          An AI-powered, minimal, and clean way to manage academic projects. Built for
          lecturers and students.
        </p>
        <div className="space-x-4">
          <Button asChild size="lg">
            <Link href="/signup" prefetch={false}>
              Get Started
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login" prefetch={false}>
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and we have a user,
    // redirect them to the dashboard.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // While checking for user auth, show a loader.
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's a user, they are being redirected, so show a loader.
  // Otherwise, if no user, show the landing page.
  if (user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <LandingPage />;
}
