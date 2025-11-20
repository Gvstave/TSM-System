
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Users, BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function LandingPage() {
  return (
    <>
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

      <section id="features" className="w-full py-12 md:py-24 bg-muted">
        <div className="container px-4 md:px-6 space-y-12">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                Key Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                Built for Education
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                A streamlined solution for creating, assigning, and completing
                academic projects.
              </p>
            </div>
          </div>
          <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <Users className="text-primary" /> For Lecturers
                </CardTitle>
                <CardDescription>
                  Efficiently create, assign, and monitor student projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Create detailed projects with deadlines.</li>
                  <li>Assign projects to students in your class.</li>
                  <li>Monitor project status from a centralized dashboard.</li>
                  <li>Leverage AI for task prioritization suggestions.</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <BookOpenCheck className="text-primary" /> For Students
                </CardTitle>
                <CardDescription>
                  Organize, prioritize, and complete your assigned projects.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Receive project assignments in one place.</li>
                  <li>Break down projects into smaller, manageable tasks.</li>
                  <li>Update task status as you work.</li>
                  <li>Use AI to get smart suggestions on what to work on next.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
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
