'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Project, Task, TaskStatus } from '@/lib/types';
import { createTask, updateTaskStatus, updateProjectStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Circle, CircleDot, CircleCheck, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { DialogFooter } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters.'),
});

interface TaskManagementProps {
  project: Project;
  readOnly: boolean;
}

const statusConfig: Record<
  TaskStatus,
  { icon: React.ElementType; color: string }
> = {
  Pending: { icon: Circle, color: 'text-muted-foreground' },
  'In Progress': { icon: CircleDot, color: 'text-blue-500' },
  Completed: { icon: CircleCheck, color: 'text-green-500' },
};


export function TaskManagement({ project, readOnly }: TaskManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '' },
  });

  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('projectId', '==', project.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks.sort((a,b) => a.createdAt.toMillis() - b.createdAt.toMillis()));
    });
    return () => unsubscribe();
  }, [project.id]);

  async function onSubmit(values: z.infer<typeof taskSchema>) {
    if (!user || readOnly) return;
    setIsLoading(true);

    const result = await createTask({
      projectId: project.id,
      title: values.title,
      status: 'Pending',
      createdBy: user.uid,
    });

    if (result.success) {
      toast({ title: 'Task Added', description: `"${values.title}" has been added.` });
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsLoading(false);
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!user || readOnly) return;
    setIsUpdating(taskId);
    const result = await updateTaskStatus(taskId, newStatus, user.uid);
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
    setIsUpdating(null);
  };
  
  const handleProjectSubmit = async () => {
    if (!user || readOnly) return;
    setIsSubmitting(true);
    const result = await updateProjectStatus(project.id, 'Completed', user.uid);
     if (result.success) {
      toast({
        title: 'Project Submitted!',
        description: 'Your project has been marked as completed and sent for review.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  }

  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.status === 'Completed');

  return (
    <div className="space-y-4">
      {!readOnly && (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormControl>
                        <Input placeholder="Break down project into a smaller task..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Add Task</span>
                </Button>
                </form>
            </Form>
            <Separator />
        </>
      )}
      
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <Card key={task.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <p className="flex-grow">{task.title}</p>
                <Select
                    value={task.status}
                    onValueChange={(newStatus: TaskStatus) => handleStatusChange(task.id, newStatus)}
                    disabled={isUpdating === task.id || readOnly}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue>
                            <div className="flex items-center gap-2">
                                {isUpdating === task.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    React.createElement(statusConfig[task.status].icon, {
                                        className: cn('h-4 w-4', statusConfig[task.status].color),
                                    })
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
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {readOnly ? 'The student has not created any tasks for this project yet.' : 'No tasks created yet. Add your first task above.'}
          </p>
        )}
      </div>

       {!readOnly && project.status !== 'Completed' && (
        <>
            <Separator />
            <DialogFooter className="pt-4">
                 <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <div tabIndex={0} className={cn(!allTasksCompleted ? 'cursor-not-allowed' : '')}>
                                <Button
                                    onClick={handleProjectSubmit}
                                    disabled={!allTasksCompleted || isSubmitting}
                                    className="w-full md:w-auto"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Submit Project
                                </Button>
                             </div>
                        </TooltipTrigger>
                        {!allTasksCompleted && (
                            <TooltipContent>
                                <p>All tasks must be completed before you can submit.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </DialogFooter>
        </>
      )}
    </div>
  );
}
