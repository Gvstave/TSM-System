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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Project, ProjectStatus, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Circle,
  CircleCheck,
  CircleDot,
  Clock,
  Loader2,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { updateProjectStatus } from '@/lib/actions';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { TaskManagement } from './task-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';

interface ProjectCardProps {
  project: Project;
  userRole: 'lecturer' | 'student';
}

const statusConfig: Record<
  ProjectStatus,
  { icon: React.ElementType; color: string }
> = {
  Pending: { icon: Circle, color: 'text-muted-foreground' },
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

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!user) return;
    setIsUpdating(true);
    const result = await updateProjectStatus(project.id, newStatus, user.uid);
    if (result.success) {
      toast({
        title: 'Status Updated',
        description: `Project status changed to "${newStatus}".`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
    }
    setIsUpdating(false);
  };

  const StatusIcon = statusConfig[project.status].icon;

  return (
    <Card className={cn('flex flex-col transition-all', cardBorderColor)}>
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
            {userRole === 'lecturer' && (
            <div>
                <Badge variant="secondary">Assigned to: {project.assignedToName}</Badge>
            </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            {userRole === 'student' ? (
              <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">Manage Tasks</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline">{project.title} - Tasks</DialogTitle>
                    </DialogHeader>
                    <TaskManagement project={project} />
                </DialogContent>
              </Dialog>
            ) : (
            <Badge
                variant="outline"
                className="flex items-center gap-2 text-sm"
            >
                <StatusIcon
                className={cn('h-4 w-4', statusConfig[project.status].color)}
                />
                {project.status}
            </Badge>
            )}
             {userRole === 'lecturer' && project.grade && (
                <Badge>Grade: {project.grade}%</Badge>
            )}
        </CardFooter>
    </Card>
  );
}
