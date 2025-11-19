import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });


export const metadata: Metadata = {
  title: 'TMS',
  description: 'Task Management System',
};

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
          spaceGrotesk.variable,
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
