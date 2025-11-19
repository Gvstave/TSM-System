'use client';

import { useAuth } from '@/context/auth-context';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const LecturerDashboard = dynamic(
  () =>
    import('@/components/dashboard/lecturer-dashboard').then(
      (mod) => mod.LecturerDashboard
    ),
  {
    loading: () => <DashboardLoadingSkeleton />,
  }
);

const StudentDashboard = dynamic(
  () =>
    import('@/components/dashboard/student-dashboard').then(
      (mod) => mod.StudentDashboard
    ),
  {
    loading: () => <DashboardLoadingSkeleton />,
  }
);

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DashboardLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {user.role === 'lecturer' ? (
        <LecturerDashboard currentUser={user} />
      ) : (
        <StudentDashboard currentUser={user} />
      )}
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="flex w-full md:w-auto items-center space-x-2">
          <Skeleton className="h-10 w-full md:w-36" />
          <Skeleton className="h-10 w-full md:w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
