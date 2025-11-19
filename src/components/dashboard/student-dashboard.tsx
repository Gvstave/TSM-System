'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCard } from './task-card';
import { WelcomeHeader } from './welcome-header';
import { AiStudentPrioritizer } from './ai-student-prioritizer';
import { Loader2 } from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
}

export function StudentDashboard({ currentUser }: StudentDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task)
      );
      setTasks(fetchedTasks.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  const renderTaskList = (filteredTasks: Task[]) => {
    if (loading) {
       return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (filteredTasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center h-64">
          <h3 className="text-lg font-semibold text-muted-foreground">You have no tasks.</h3>
          <p className="text-sm text-muted-foreground/80">Enjoy your free time!</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} userRole="student" />
        ))}
      </div>
    );
  };
  
  const statuses: Task['status'][] = ['Pending', 'In Progress', 'Completed'];

  return (
    <>
      <WelcomeHeader 
        user={currentUser} 
        actionSlot={<AiStudentPrioritizer tasks={tasks} />}
      />
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {statuses.map(status => (
            <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {renderTaskList(tasks)}
        </TabsContent>
        {statuses.map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {renderTaskList(tasks.filter(t => t.status === status))}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
