'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  collection,
  query,
  onSnapshot,
  Timestamp,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Project, Task, TaskStatus, Comment } from '@/lib/types';
import {
  createTask,
  updateTaskStatus,
  updateProjectStatus,
  addCommentToTask,
} from '@/lib/actions';
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
import {
  Plus,
  Loader2,
  Circle,
  CircleDot,
  CircleCheck,
  Send,
  CalendarIcon,
  CornerDownRight,
  MessageSquarePlus,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { DialogFooter } from '../ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters.'),
  dueDate: z.date().optional(),
});

const subtaskSchema = z.object({
    title: z.string().min(3, 'Subtask title must be at least 3 characters.'),
});

const commentSchema = z.object({
    text: z.string().min(1, 'Comment cannot be empty.'),
});

interface TaskManagementProps {
  project: Project;
  readOnly: boolean;
  onTaskCreated?: () => void;
}

const statusConfig: Record<
  TaskStatus,
  { icon: React.ElementType; color: string }
> = {
  Pending: { icon: Circle, color: 'text-muted-foreground' },
  'In Progress': { icon: CircleDot, color: 'text-blue-500' },
  Completed: { icon: CircleCheck, color: 'text-green-500' },
};

export function TaskManagement({
  project,
  readOnly,
  onTaskCreated,
}: TaskManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', dueDate: undefined },
  });

  const subtaskForm = useForm<z.infer<typeof subtaskSchema>>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: { title: '' },
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '' },
  });

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', project.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task)
      );
      const sortedTasks = fetchedTasks.sort(
          (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()
      );
      setTasks(sortedTasks);
      if (!selectedTask && sortedTasks.length > 0) {
        setSelectedTask(sortedTasks[0]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [project.id]);

  useEffect(() => {
    if (selectedTask) {
      const commentsQuery = query(
        collection(db, 'tasks', selectedTask.id, 'comments'),
        orderBy('createdAt', 'asc')
      );
      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const fetchedComments = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Comment)
        );
        setComments(fetchedComments);
      });
      return () => unsubscribe();
    } else {
      setComments([]);
    }
  }, [selectedTask]);

  const { parentTasks, allTasksCompleted } = useMemo(() => {
    const parentTasksMap = new Map<string, Task>();
    const subtasksMap = new Map<string, Task[]>();

    for (const task of tasks) {
      if (task.parentId) {
        if (!subtasksMap.has(task.parentId)) {
          subtasksMap.set(task.parentId, []);
        }
        subtasksMap.get(task.parentId)!.push(task);
      } else {
        parentTasksMap.set(task.id, { ...task, subtasks: [] });
      }
    }

    for (const [parentId, subtasks] of subtasksMap.entries()) {
      if (parentTasksMap.has(parentId)) {
        parentTasksMap.get(parentId)!.subtasks = subtasks.sort(
          (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()
        );
      }
    }

    const parentTasksArray = Array.from(parentTasksMap.values());
    const allTasksCompleted =
      tasks.length > 0 && tasks.every((t) => t.status === 'Completed');

    return { parentTasks: parentTasksArray, allTasksCompleted };
  }, [tasks]);

  async function onTaskSubmit(values: z.infer<typeof taskSchema>) {
    if (!user || readOnly) return;
    setIsLoading(true);

    const result = await createTask({
      projectId: project.id,
      title: values.title,
      status: 'Pending',
      createdBy: user.uid,
      dueDate: values.dueDate?.toISOString(),
    });

    if (result.success) {
      toast({
        title: 'Task Added',
        description: `"${values.title}" has been added.`,
      });
      taskForm.reset();
      if (result.updatedProjectStatus) {
        onTaskCreated?.();
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsLoading(false);
  }

  async function handleSubtaskSubmit(values: z.infer<typeof subtaskSchema>, parentId: string) {
    if (!user || readOnly) return;
    setIsLoading(true);

    const result = await createTask({
      projectId: project.id,
      title: values.title,
      status: 'Pending',
      createdBy: user.uid,
      parentId,
    });

    if (result.success) {
      toast({
        title: 'Subtask Added',
        description: `"${values.title}" has been added.`,
      });
      subtaskForm.reset();
      setShowSubtaskInput(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsLoading(false);
  }


  async function onCommentSubmit(values: z.infer<typeof commentSchema>) {
    if (!user || !selectedTask) return;
    setIsCommenting(true);

    const result = await addCommentToTask({
        taskId: selectedTask.id,
        userId: user.uid,
        userName: user.name,
        userImage: user.image,
        text: values.text,
    });

    if (result.success) {
        commentForm.reset();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: "Could not post comment."
        });
    }
    setIsCommenting(false);
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
        description:
          'Your project has been marked as completed and sent for review.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  const isProjectCompleted = project.status === 'Completed';

  const renderTask = (task: Task, isSubtask: boolean) => (
    <Card
        key={task.id}
        className={cn(
            "w-full cursor-pointer transition-colors", 
            isSubtask && "ml-12",
            selectedTask?.id === task.id ? "bg-muted/80" : "bg-card hover:bg-muted/50"
        )}
        onClick={() => setSelectedTask(task)}
    >
      <CardContent className="flex items-center justify-between p-3">
        <p className="flex-1 font-medium text-sm line-clamp-1">{task.title}</p>
        <div className="flex items-center gap-2">
            {task.dueDate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format((task.dueDate as Timestamp).toDate(), 'MMM d')}</span>
                </div>
            )}
           {!isSubtask && !readOnly && !isProjectCompleted && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setShowSubtaskInput(current => current === task.id ? null : task.id)}}>
                                <MessageSquarePlus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add subtask</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            )}
          <Select
            value={task.status}
            onValueChange={(newStatus: TaskStatus) =>
              handleStatusChange(task.id, newStatus)
            }
            disabled={isUpdating === task.id || readOnly || isProjectCompleted}
          >
            <SelectTrigger className="w-[150px] text-xs h-8">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {isUpdating === task.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    React.createElement(statusConfig[task.status].icon, {
                      className: cn(
                        'h-3 w-3',
                        statusConfig[task.status].color
                      ),
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
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {!readOnly && !isProjectCompleted && (
        <>
          <Form {...taskForm}>
            <form
              onSubmit={taskForm.handleSubmit(onTaskSubmit)}
              className="flex items-start gap-4"
            >
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input placeholder="Add a new task..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taskForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[180px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Set due date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() ||
                            date > (project.deadline as Timestamp).toDate()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Task
              </Button>
            </form>
          </Form>
          <Separator />
        </>
      )}

      <div className="flex-1 grid grid-cols-2 gap-6 items-start min-h-[400px]">
        <div className="flex flex-col h-full space-y-2 rounded-lg border p-2">
           {parentTasks.length === 0 && !isLoading && (
                 <div className="flex h-full flex-col items-center justify-center rounded-lg bg-muted/50 p-12 text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                        {readOnly ? 'No tasks yet' : 'No tasks created yet'}
                    </h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {readOnly
                        ? 'The student has not created any tasks.'
                        : 'Add your first task to get started.'}
                    </p>
                </div>
            )}
            <ScrollArea className="flex-1 w-full">
                <div className="space-y-2 p-2">
                    {parentTasks.map((task) => (
                    <div key={task.id} className="space-y-2">
                        {renderTask(task, false)}
                        {showSubtaskInput === task.id && !readOnly && !isProjectCompleted && (
                            <Form {...subtaskForm}>
                                <form onSubmit={subtaskForm.handleSubmit(values => handleSubtaskSubmit(values, task.id))} className="ml-12 flex items-center gap-2">
                                    <CornerDownRight className="h-5 w-5 text-muted-foreground" />
                                    <FormField
                                        control={subtaskForm.control}
                                        name="title"
                                        render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormControl>
                                            <Input placeholder="Add a new subtask..." {...field} autoFocus />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isLoading} size="icon">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        <span className="sr-only">Add Subtask</span>
                                    </Button>
                                </form>
                            </Form>
                        )}
                        {task.subtasks?.map((subtask) => renderTask(subtask, true))}
                    </div>
                    ))}
                 </div>
            </ScrollArea>
        </div>
        <div className="rounded-lg border h-full flex flex-col">
            {selectedTask ? (
                <>
                    <div className="p-4 border-b">
                        <h4 className="font-semibold line-clamp-1">{selectedTask.title}</h4>
                        <p className="text-sm text-muted-foreground">Comments and activity</p>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                        {comments.length > 0 ? (
                            comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.userImage} />
                                        <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1'>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">{comment.userName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow((comment.createdAt as Timestamp).toDate(), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No comments on this task yet.</p>
                        )}
                        </div>
                    </ScrollArea>
                    {!readOnly && !isProjectCompleted && (
                        <div className="p-4 border-t bg-muted/50">
                             <Form {...commentForm}>
                                <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="flex items-center gap-2">
                                    <FormField
                                    control={commentForm.control}
                                    name="text"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                        <FormControl>
                                            <Input placeholder="Add a comment..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <Button type="submit" disabled={isCommenting}>
                                        {isCommenting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                     <MessageCircle className="h-16 w-16 text-muted-foreground/50" />
                     <p className="mt-4 font-medium text-muted-foreground">Select a task to view comments</p>
                </div>
            )}
        </div>
      </div>
      {!readOnly && project.status !== 'Completed' && (
        <DialogFooter className="pt-4">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  tabIndex={0}
                  className={cn(!allTasksCompleted ? 'cursor-not-allowed' : '')}
                >
                  <Button
                    onClick={handleProjectSubmit}
                    disabled={!allTasksCompleted || isSubmitting}
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
      )}
    </div>
  );
}
