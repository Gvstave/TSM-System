
'use client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        // Corrected: Redirect to the public landing page, which is at the root.
        // The (public) layout will handle rendering the correct page.
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  // This loader is shown while the initial authentication check is in progress.
  // The useEffect above will handle the redirection once the check is complete.
  // Unauthenticated users are redirected to the public landing page which is rendered by src/app/(public)/page.tsx
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
