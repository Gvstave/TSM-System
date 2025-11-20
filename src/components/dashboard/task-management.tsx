
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  doc,
  getFirestore,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
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
  MessageSquarePlus,
  MessageCircle,
  UserCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
import { ScrollArea } from '../ui/scroll-area';
import { AITaskSuggester } from './ai-task-suggester';

const db = getFirestore(app);

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
  project: initialProject,
  readOnly,
}: TaskManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
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

  const fetchTasks = useCallback(() => {
    if (!initialProject) return;
    setIsLoading(true);
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', initialProject.id),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task)
      );
      setTasks(fetchedTasks);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [initialProject]);

  useEffect(() => {
    const unsubscribe = fetchTasks();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchTasks]);
  
  useEffect(() => {
    if (tasks.length > 0) {
      const selectedExists = tasks.some(t => t.id === selectedTask?.id);
      if (!selectedExists || !selectedTask) {
        setSelectedTask(tasks.find(t => !t.parentId) || tasks[0]);
      } else {
        const updatedSelectedTask = tasks.find(t => t.id === selectedTask.id);
        if (updatedSelectedTask) {
          setSelectedTask(updatedSelectedTask);
        }
      }
    } else {
      setSelectedTask(null);
    }
  }, [tasks, selectedTask?.id]);


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
        parentTasksMap.get(parentId)!.subtasks = subtasks;
      }
    }

    const parentTasksArray = Array.from(parentTasksMap.values());
    const allTasksCompleted =
      tasks.length > 0 && tasks.every((t) => t.status === 'Completed');

    return { parentTasks: parentTasksArray, allTasksCompleted };
  }, [tasks]);

  async function onTaskSubmit(values: z.infer<typeof taskSchema>) {
    if (!user || readOnly || !initialProject) return;
    setIsSubmittingTask(true);

    const result = await createTask({
      projectId: initialProject.id,
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
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsSubmittingTask(false);
  }

  async function handleSubtaskSubmit(values: z.infer<typeof subtaskSchema>, parentId: string) {
    if (!user || readOnly || !initialProject) return;
    setIsSubmittingTask(true);

    const result = await createTask({
      projectId: initialProject.id,
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
    setIsSubmittingTask(false);
  }


  async function onCommentSubmit(values: z.infer<typeof commentSchema>) {
    if (!user || !selectedTask) return;
    setIsCommenting(true);

    const result = await addCommentToTask({
        taskId: selectedTask.id,
        userId: user.uid,
        userName: user.name,
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
    if (!user || readOnly || !initialProject) return;
    setIsSubmitting(true);
    const result = await updateProjectStatus(initialProject.id, 'Completed', user.uid);
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

  const isProjectCompleted = initialProject.status === 'Completed';

  const renderTask = (task: Task, isSubtask: boolean) => (
    <Card
        key={task.id}
        className={cn(
            "w-full cursor-pointer transition-colors bg-card", 
            isSubtask && "w-[95%]",
            selectedTask?.id === task.id ? "bg-muted border-primary" : "hover:bg-muted/50"
        )}
        onClick={() => setSelectedTask(task)}
    >
      <CardContent className={cn("flex items-center justify-between p-2.5", isSubtask && "p-1.5 pl-12")}>
        <p className={cn("flex-1 font-medium line-clamp-1 text-sm", isSubtask && "text-xs")}>{task.title}</p>
        <div className="flex items-center gap-2">
            {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
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
            <SelectTrigger className={cn("w-[140px] text-xs h-8", isSubtask && "h-7 text-xs")}>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {isUpdating === task.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
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
                      <Icon className={cn('h-3 w-3', color)} />
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

  if (!initialProject) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {!readOnly && !isProjectCompleted && (
        <div className='space-y-4 rounded-md border p-4'>
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
                            date > (initialProject.deadline as Timestamp).toDate()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingTask}>
                {isSubmittingTask ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Task
              </Button>
            </form>
          </Form>
           <div className="flex justify-end">
              <AITaskSuggester project={initialProject} existingTasks={tasks} onTasksAdded={fetchTasks} />
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 flex-1">
        <div className="flex flex-col space-y-2 rounded-md border p-2">
           {parentTasks.length === 0 && !isLoading && (
                 <div className="flex h-full flex-col items-center justify-center rounded-lg bg-muted/50 p-12 text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                        {readOnly ? 'No tasks yet' : 'No tasks created yet'}
                    </h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {readOnly
                        ? 'The student has not created any tasks.'
                        : 'Add your first task or use the AI generator to get started.'}
                    </p>
                </div>
            )}
            {isLoading && parentTasks.length === 0 && (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            <ScrollArea className="flex-1">
                <div className="space-y-2 p-2">
                    {parentTasks.map((task) => (
                    <div key={task.id} className="space-y-1">
                        {renderTask(task, false)}
                        {showSubtaskInput === task.id && !readOnly && !isProjectCompleted && (
                            <div className='flex justify-end'>
                                <div className='w-[95%]'>
                                    <Form {...subtaskForm}>
                                        <form onSubmit={subtaskForm.handleSubmit(values => handleSubtaskSubmit(values, task.id))} className="flex items-center gap-2">
                                            <FormField
                                                control={subtaskForm.control}
                                                name="title"
                                                render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                    <FormControl>
                                                    <Input placeholder="Add a new subtask..." {...field} autoFocus className='h-7 text-xs'/>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <Button type="submit" disabled={isSubmittingTask} size="sm" className="h-7">
                                                {isSubmittingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                <span className="sr-only">Add Subtask</span>
                                            </Button>
                                        </form>
                                    </Form>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col space-y-1 items-end">
                            {task.subtasks?.map((subtask) => renderTask(subtask, true))}
                        </div>
                    </div>
                    ))}
                 </div>
            </ScrollArea>
        </div>
        <div className="flex h-full flex-col rounded-lg border">
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
                                    <UserCircle className="h-8 w-8 text-muted-foreground" />
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
      {!readOnly && initialProject.status !== 'Completed' && (
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

    