
'use client';
import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

// Since we can't use usePathname in metadata, we'll set a generic title.
// export const metadata: Metadata = {
//   title: 'TMS',
//   description: 'Task Management System',
// };

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isPublicPage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      {isPublicPage && !loading && !user && (
        <header className="px-4 lg:px-6 h-16 flex items-center border-b">
          <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
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
      )}
      <main className="flex-1 flex flex-col">{children}</main>
      {isPublicPage && !loading && !user && (
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
      )}
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <AuthProvider>
          <AppContent>{children}</AppContent>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
