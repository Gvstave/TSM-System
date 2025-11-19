'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page has been moved to the main landing page.
// We redirect to the dashboard for any logged-in users who might land here.
export default function AboutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}
