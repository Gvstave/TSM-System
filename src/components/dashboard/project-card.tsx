'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project, ProjectStatus, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CircleCheck,
  CircleDot,
  Clock,
  Users
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { TaskManagement } from './task-management';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface ProjectCardProps {
  project: Project;
  userRole: 'lecturer' | 'student';
  students?: User[];
}

const statusConfig: Record<
  ProjectStatus,
  { icon: React.ElementType; color: string }
> = {
  Pending: { icon: Clock, color: 'text-muted-foreground' },
  'In Progress': { icon: CircleDot, color: 'text-blue-500' },
  Completed: { icon: CircleCheck, color: 'text-green-500' },
};

export function ProjectCard({ project, userRole, students = [] }: ProjectCardProps) {

  const getDeadlineDate = (deadline: Project['deadline']): Date => {
    if (deadline instanceof Timestamp) {
      return deadline.toDate();
    }
    if (deadline && typeof deadline.seconds === 'number') {
      return new Timestamp(deadline.seconds, deadline.nanoseconds).toDate();
    }
    return new Date();
  };

  const deadlineDate = getDeadlineDate(project.deadline);
  const daysUntilDeadline = differenceInDays(deadlineDate, new Date());

  let deadlineColor = 'text-muted-foreground';
  let deadlineText = `Due ${format(deadlineDate, 'PPP')}`;
  let cardBorderColor = 'border-border';

  if (project.status !== 'Completed') {
    if (daysUntilDeadline < 0) {
      deadlineColor = 'text-destructive';
      deadlineText = `Overdue by ${-daysUntilDeadline} day(s)`;
      cardBorderColor = 'border-destructive';
    } else if (daysUntilDeadline <= 3) {
      deadlineColor = 'text-primary';
      deadlineText = `Due in ${daysUntilDeadline} day(s)`;
      cardBorderColor = 'border-primary';
    }
  }

  const StatusIcon = statusConfig[project.status].icon;
  
  const assignedToNames = Array.isArray(project.assignedTo)
    ? project.assignedTo
        .map(studentId => {
          // Find the student in the `students` array passed as a prop.
          const foundStudent = students.find(s => s.uid === studentId);
          return foundStudent ? foundStudent.name : 'Unknown';
        })
        .join(', ')
    : 'No students assigned';


  const cardContent = (
     <Card className={cn('flex h-full flex-col transition-all', cardBorderColor, 'cursor-pointer hover:shadow-md')}>
        <CardHeader>
            <CardTitle className="font-headline text-lg tracking-tight line-clamp-2">
            {project.title}
            </CardTitle>
            <CardDescription className="h-[60px] line-clamp-3">
            {project.description}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <div className={cn('flex items-center text-sm', deadlineColor)}>
            {daysUntilDeadline < 0 && project.status !== 'Completed' ? (
                <AlertTriangle className="mr-2 h-4 w-4" />
            ) : (
                <Clock className="mr-2 h-4 w-4" />
            )}
            <span>{deadlineText}</span>
            </div>
             <div className="flex items-center justify-between">
                <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-sm"
                >
                    <StatusIcon
                    className={cn('h-4 w-4', statusConfig[project.status].color)}
                    />
                    {project.status}
                </Badge>
                 {userRole === 'lecturer' && project.grade && (
                    <Badge>Grade: {project.grade}%</Badge>
                )}
            </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
           <div className="flex items-center text-xs text-muted-foreground">
                <Users className="mr-2 h-3 w-3" />
                <span className="truncate">{assignedToNames}</span>
            </div>
            {userRole === 'student' && (
                 <Button variant="outline" className="w-full !mt-4">Manage Tasks</Button>
            )}
        </CardFooter>
    </Card>
  )

  const dialogTitle = userRole === 'lecturer' ? `${project.title} - Task Progress` : `${project.title} - Tasks`;
  const dialogDescription = userRole === 'lecturer' ? `Viewing tasks for ${assignedToNames}.` : "Break down your project into smaller tasks.";


  return (
    <Dialog>
        <DialogTrigger asChild>
            {cardContent}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
                 <p className="text-sm text-muted-foreground">
                    {dialogDescription}
                  </p>
            </DialogHeader>
            <TaskManagement project={project} readOnly={userRole === 'lecturer'} />
        </DialogContent>
    </Dialog>
  );
}
