'use client';

import { LecturerDashboard } from '@/components/dashboard/lecturer-dashboard';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';
import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // Or a loading spinner
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
