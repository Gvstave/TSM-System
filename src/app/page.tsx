
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Users, BookOpenCheck, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-headline">TMS</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button asChild variant="ghost">
            <Link href="/login" prefetch={false}>
              Sign In
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup" prefetch={false}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none font-headline">
                  A Better Way to Manage Academic Projects
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Our Task Management System is designed to streamline project workflows for both lecturers and students, fostering collaboration and ensuring deadlines are met.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                    <Link href="/signup" prefetch={false}>
                        Get Started
                    </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6 space-y-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Built for Education</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            A streamlined solution for creating, assigning, and completing academic projects.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Users className="text-primary"/> For Lecturers
                        </CardTitle>
                        <CardDescription>
                            Efficiently create, assign, and monitor student projects.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Create detailed projects with descriptions and deadlines.</li>
                            <li>Assign projects to individual students or groups in your class.</li>
                            <li>Monitor project status (Pending, In Progress, Completed) from a centralized dashboard.</li>
                            <li>View task breakdowns for each project to see student progress.</li>
                            <li>Leverage AI to get prioritization suggestions based on deadlines and student workloads.</li>
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
                            <li>Receive project assignments from your lecturer in one place.</li>
                            <li>Break down large projects into smaller, manageable tasks.</li>
                            <li>Update the status of each task as you work on it.</li>
                            <li>Use the AI Prioritizer to get smart suggestions on what to work on next.</li>
                            <li>Submit your project for review once all tasks are completed.</li>
                    </ul>
                    </CardContent>
                </Card>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Task Management System. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
