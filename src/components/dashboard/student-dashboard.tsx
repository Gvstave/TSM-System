'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard } from './project-card';
import { WelcomeHeader } from './welcome-header';
import { AiStudentPrioritizer } from './ai-student-prioritizer';
import { Loader2 } from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
}

export function StudentDashboard({ currentUser }: StudentDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'projects'),
      where('assignedTo', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Project)
      );
      setProjects(fetchedProjects.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  const renderProjectList = (filteredProjects: Project[]) => {
    if (loading) {
       return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (filteredProjects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center h-64">
          <h3 className="text-lg font-semibold text-muted-foreground">You have no projects.</h3>
          <p className="text-sm text-muted-foreground/80">Enjoy your free time!</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} userRole="student" />
        ))}
      </div>
    );
  };
  
  const statuses: Project['status'][] = ['Pending', 'In Progress', 'Completed'];

  return (
    <>
      <WelcomeHeader 
        user={currentUser} 
        actionSlot={
          <AiStudentPrioritizer projects={projects} />
        }
      />
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {statuses.map(status => (
            <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {renderProjectList(projects)}
        </TabsContent>
        {statuses.map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {renderProjectList(projects.filter(p => p.status === status))}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
