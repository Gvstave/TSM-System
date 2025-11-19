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
import type { Task, TaskStatus, User } from '@/lib/types';
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
import { updateTaskStatus } from '@/lib/actions';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

interface TaskCardProps {
  task: Task;
  userRole: 'lecturer' | 'student';
}

const statusConfig: Record<
  TaskStatus,
  { icon: React.ElementType; color: string }
> = {
  Pending: { icon: Circle, color: 'text-muted-foreground' },
  'In Progress': { icon: CircleDot, color: 'text-blue-500' },
  Completed: { icon: CircleCheck, color: 'text-green-500' },
};

export function TaskCard({ task, userRole }: TaskCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // The deadline can be a Timestamp or a serialized object with seconds and nanoseconds
  const getDeadlineDate = (deadline: Task['deadline']): Date => {
    if (deadline instanceof Timestamp) {
      return deadline.toDate();
    }
    // If it's serialized, it will be an object with seconds and nanoseconds
    if (deadline && typeof deadline.seconds === 'number') {
      return new Timestamp(deadline.seconds, deadline.nanoseconds).toDate();
    }
    // Fallback for unexpected formats, though this shouldn't happen
    return new Date();
  };

  const deadlineDate = getDeadlineDate(task.deadline);
  const daysUntilDeadline = differenceInDays(deadlineDate, new Date());

  let deadlineColor = 'text-muted-foreground';
  let deadlineText = `Due ${format(deadlineDate, 'PPP')}`;
  let cardBorderColor = 'border-border';

  if (task.status !== 'Completed') {
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

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!user) return;
    setIsUpdating(true);
    const result = await updateTaskStatus(task.id, newStatus, user.uid);
    if (result.success) {
      toast({
        title: 'Status Updated',
        description: `Task status changed to "${newStatus}".`,
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

  const StatusIcon = statusConfig[task.status].icon;

  return (
    <Card className={cn('flex flex-col transition-all', cardBorderColor)}>
      <CardHeader>
        <CardTitle className="font-headline text-lg tracking-tight line-clamp-2">
          {task.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 h-[60px]">
          {task.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className={cn('flex items-center text-sm', deadlineColor)}>
          {daysUntilDeadline < 0 && task.status !== 'Completed' ? (
            <AlertTriangle className="mr-2 h-4 w-4" />
          ) : (
            <Clock className="mr-2 h-4 w-4" />
          )}
          <span>{deadlineText}</span>
        </div>
        {userRole === 'lecturer' && (
          <div>
            <Badge variant="secondary">Assigned to: {task.assignedToName}</Badge>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {userRole === 'student' ? (
          <Select
            value={task.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StatusIcon
                      className={cn('h-4 w-4', statusConfig[task.status].color)}
                    />
                  )}
                  <span>{task.status}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(statusConfig).map((status) => {
                const Icon = statusConfig[status as TaskStatus].icon;
                const color = statusConfig[status as TaskStatus].color;
                return (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', color)} />
                      <span>{status}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          <Badge
            variant="outline"
            className="flex items-center gap-2 text-sm"
          >
            <StatusIcon
              className={cn('h-4 w-4', statusConfig[task.status].color)}
            />
            {task.status}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
