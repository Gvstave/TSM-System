import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b px-4 lg:px-6">
        <Link
          href="/home"
          className="flex items-center justify-center gap-2"
          prefetch={false}
        >
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">TMS</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button asChild variant="ghost">
            <Link href="/login" prefetch={false}>
              Sign in
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup" prefetch={false}>
              Sign up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="flex w-full shrink-0 flex-col items-center gap-2 border-t px-4 py-6 sm:flex-row md:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 Task Management System. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:ml-auto sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
            prefetch={false}
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
            prefetch={false}
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
