'use client';

import { useAuth } from '@/context/auth-context';
import { LecturerDashboard } from '@/components/dashboard/lecturer-dashboard';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <DashboardLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
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
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="flex w-full items-center space-x-2 md:w-auto">
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
