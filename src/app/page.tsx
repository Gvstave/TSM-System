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
        // The public landing page is at the root `/`
        // This will render the component from /app/(public)/page.tsx
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  // During the initial authentication check, this loader will be shown.
  // Once the check is complete, the useEffect will redirect the user.
  // If the user is unauthenticated, they will be sent to the public landing page,
  // which will then be rendered instead of this loader.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
