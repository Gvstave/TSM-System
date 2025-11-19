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
import { useToast } from '@/hooks/use-toast';
import type { Project, ProjectStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CircleCheck,
  CircleDot,
  Clock,
  Loader2,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useState } from 'react';
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
}

const statusConfig: Record<
  ProjectStatus,
  { icon: React.ElementType; color: string }
> = {
  Pending: { icon: Clock, color: 'text-muted-foreground' },
  'In Progress': { icon: CircleDot, color: 'text-blue-500' },
  Completed: { icon: CircleCheck, color: 'text-green-500' },
};

export function ProjectCard({ project, userRole }: ProjectCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

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

  const cardContent = (
     <Card className={cn('flex flex-col transition-all h-full', cardBorderColor, userRole === 'lecturer' && 'cursor-pointer hover:shadow-md')}>
        <CardHeader>
            <CardTitle className="font-headline text-lg tracking-tight line-clamp-2">
            {project.title}
            </CardTitle>
            <CardDescription className="line-clamp-3 h-[60px]">
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
            {userRole === 'lecturer' && (
                <Badge variant="secondary">Assigned to: {project.assignedToName}</Badge>
            )}
             {userRole === 'student' && (
                 <Button variant="outline" className="w-full">Manage Tasks</Button>
            )}
        </CardFooter>
    </Card>
  )

  if (userRole === 'student') {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {cardContent}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">{project.title} - Tasks</DialogTitle>
                </DialogHeader>
                <TaskManagement project={project} readOnly={false} />
            </DialogContent>
        </Dialog>
    )
  }

  return (
    <Dialog>
        <DialogTrigger asChild>
            {cardContent}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle className="font-headline">{project.title} - Task Progress</DialogTitle>
                 <p className="text-sm text-muted-foreground">
                    Viewing tasks for {project.assignedToName}.
                  </p>
            </DialogHeader>
            <TaskManagement project={project} readOnly={true} />
        </DialogContent>
    </Dialog>
  );
}
