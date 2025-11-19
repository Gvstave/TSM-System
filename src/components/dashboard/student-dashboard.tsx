'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
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
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'projects'),
      where('assignedTo', 'array-contains', currentUser.uid)
    );
    const unsubscribeProjects = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProjects = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Project)
        );
        setProjects(
          fetchedProjects.sort(
            (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
          )
        );
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching projects: ', error);
        setLoading(false);
      }
    );
    
    // Fetch all student users to resolve names in the project card
    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const fetchedStudents = snapshot.docs.map(doc => doc.data() as User);
      setStudents(fetchedStudents);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeStudents();
    };
  }, [currentUser]);

  const renderProjectList = (filteredProjects: Project[]) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (filteredProjects.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">
            You have no projects.
          </h3>
          <p className="text-sm text-muted-foreground/80">
            Enjoy your free time!
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            userRole="student"
            students={students}
          />
        ))}
      </div>
    );
  };

  const statuses: Project['status'][] = ['Pending', 'In Progress', 'Completed'];

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <WelcomeHeader
        user={currentUser}
        actionSlot={
          <div className="w-full md:w-auto">
            <AiStudentPrioritizer projects={projects} />
          </div>
        }
      />
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex md:grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          {statuses.map((status) => (
            <TabsTrigger key={status} value={status}>
              {status}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {renderProjectList(projects)}
        </TabsContent>
        {statuses.map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {renderProjectList(projects.filter((p) => p.status === status))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
