
'use client';
import { AuthForm } from '@/components/auth/auth-form';
import { Suspense } from 'react';

function SignupPageContent() {
  return <AuthForm type="signup" />;
}

export default function SignupPage() {
    return (
        <Suspense>
            <SignupPageContent />
        </Suspense>
    )
}
