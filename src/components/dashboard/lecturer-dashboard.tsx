'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  getDocs,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard } from './project-card';
import { WelcomeHeader } from './welcome-header';
import { CreateProjectDialog } from './create-project-dialog';
import { AiLecturerPrioritizer } from './ai-lecturer-prioritizer';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteProject } from '@/lib/actions';

interface LecturerDashboardProps {
  currentUser: User;
}

export function LecturerDashboard({ currentUser }: LecturerDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(
      collection(db, 'projects'),
      where('createdBy', '==', currentUser.uid)
    );
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Project)
      );
      setProjects(
        fetchedProjects.sort(
          (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
        )
      );
      setLoading(false);
    });

    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const fetchedStudents = snapshot.docs.map((doc) => doc.data() as User);
      setStudents(fetchedStudents);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeStudents();
    };
  }, [currentUser.uid]);

  const handleDeleteProject = async (projectId: string) => {
    const result = await deleteProject(projectId, currentUser.uid);
    if (result.success) {
      toast({
        title: 'Project Deleted',
        description: 'The project and all its tasks have been removed.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Project',
        description: result.error,
      });
    }
  };

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
            No projects here yet.
          </h3>
          <p className="text-sm text-muted-foreground/80">
            Create a new project to get started.
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
            userRole="lecturer"
            students={students}
            onDeleteProject={handleDeleteProject}
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
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <AiLecturerPrioritizer projects={projects} students={students} />
            <CreateProjectDialog
              lecturerId={currentUser.uid}
              students={students}
            />
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
