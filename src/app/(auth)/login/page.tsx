
'use client';
import { AuthForm } from '@/components/auth/auth-form';
import { Suspense } from 'react';


function LoginPageContent() {
  return <AuthForm type="login" />;
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageContent />
        </Suspense>
    )
}
