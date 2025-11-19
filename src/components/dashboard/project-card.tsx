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
  MoreVertical,
  Trash2,
  Users,
  View,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useState } from 'react';

interface ProjectCardProps {
  project: Project;
  userRole: 'lecturer' | 'student';
  students?: User[];
  onDeleteProject?: (projectId: string) => void;
}

const statusConfig: Record<
  ProjectStatus,
  { icon: React.ElementType; color: string }
> = {
  Pending: { icon: Clock, color: 'text-muted-foreground' },
  'In Progress': { icon: CircleDot, color: 'text-blue-500' },
  Completed: { icon: CircleCheck, color: 'text-green-500' },
};

export function ProjectCard({
  project,
  userRole,
  students = [],
  onDeleteProject,
}: ProjectCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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
        .map((studentId) => {
          const foundStudent = students.find((s) => s.uid === studentId);
          return foundStudent ? foundStudent.name : 'Unknown';
        })
        .join(', ')
    : 'No students assigned';

  const cardContent = (
    <Card
      className={cn('flex h-full flex-col transition-all', cardBorderColor)}
    >
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-lg tracking-tight line-clamp-2">
            {project.title}
          </CardTitle>
          <CardDescription className="h-[60px] line-clamp-3">
            {project.description}
          </CardDescription>
        </div>
        {userRole === 'lecturer' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <View className="mr-2 h-4 w-4" />
                  View Tasks
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onSelect={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full !mt-4">
              Manage Tasks
            </Button>
          </DialogTrigger>
        )}
      </CardFooter>
    </Card>
  );

  const dialogTitle =
    userRole === 'lecturer'
      ? `${project.title} - Task Progress`
      : `${project.title} - Tasks`;
  const dialogDescription =
    userRole === 'lecturer'
      ? `Viewing tasks for ${assignedToNames}.`
      : 'Break down your project into smaller tasks.';

  return (
    <Dialog>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        {userRole === 'lecturer' ? cardContent : <DialogTrigger asChild>{cardContent}</DialogTrigger>}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {dialogDescription}
            </p>
          </DialogHeader>
          <TaskManagement project={project} readOnly={userRole === 'lecturer'} />
        </DialogContent>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDeleteProject) {
                  onDeleteProject(project.id);
                }
                setShowDeleteAlert(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
