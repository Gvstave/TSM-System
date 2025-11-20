'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Plus, Check, ChevronsUpDown, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { createProject } from '@/lib/actions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { breakdownProject } from '@/ai/flows/breakdown-flow';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const projectSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  deadline: z.date({ required_error: 'A deadline is required.' }),
  assignedTo: z.array(z.string()).min(1, 'Please assign this project to at least one student.'),
  tasks: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  lecturerId: string;
  students: User[];
}

export function CreateProjectDialog({ lecturerId, students }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedTo: [],
      tasks: [],
    },
  });

  const handleGenerateTasks = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    
    if (!title || !description) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a title and description before generating tasks.',
      });
      return;
    }

    setIsGenerating(true);
    setSuggestedTasks([]);
    form.setValue('tasks', []);

    try {
      const result = await breakdownProject({ title, description });
      if (result.tasks) {
        setSuggestedTasks(result.tasks);
        // Pre-select all suggested tasks
        form.setValue('tasks', result.tasks);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not generate task suggestions.',
      });
    } finally {
      setIsGenerating(false);
    }
  };


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    
    const result = await createProject({
      ...values,
      deadline: values.deadline.toISOString(),
      createdBy: lecturerId,
    });

    if (result.success) {
      toast({
        title: 'Project Created',
        description: `"${values.title}" has been assigned.`,
      });
      form.reset();
      setSuggestedTasks([]);
      setOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsLoading(false);
  }
  
  const selectedStudents = form.watch('assignedTo');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to assign a new project to one or more students.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Collaborative Research Paper" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the project requirements in detail..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleGenerateTasks} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate AI Task Suggestions
              </Button>
            </div>

            {(isGenerating || suggestedTasks.length > 0) && (
              <div className="space-y-4 rounded-md border p-4">
                <h4 className="text-sm font-medium">AI Task Suggestions</h4>
                {isGenerating ? (
                   <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Generating...</span>
                    </div>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="tasks"
                    render={() => (
                      <FormItem className="space-y-2">
                        {suggestedTasks.map((taskTitle) => (
                          <FormField
                            key={taskTitle}
                            control={form.control}
                            name="tasks"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={taskTitle}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(taskTitle)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), taskTitle])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== taskTitle
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {taskTitle}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
             <Separator />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Assign to</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-auto",
                              !selectedStudents?.length && "text-muted-foreground"
                            )}
                          >
                             <div className="flex gap-1 flex-wrap">
                                {selectedStudents.length > 0 ? (
                                    students
                                    .filter(s => selectedStudents.includes(s.uid))
                                    .map((student) => (
                                    <Badge
                                        variant="secondary"
                                        key={student.uid}
                                        className="mr-1 mb-1"
                                    >
                                        {student.name}
                                    </Badge>
                                    ))
                                ) : (
                                    "Select students"
                                )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search students..." />
                          <CommandList>
                            <CommandEmpty>No students found.</CommandEmpty>
                            <CommandGroup>
                                {students.map((student) => (
                                <CommandItem
                                    value={student.name}
                                    key={student.uid}
                                    onSelect={() => {
                                      const currentSelection = field.value || [];
                                      const index = currentSelection.indexOf(student.uid);
                                      if (index > -1) {
                                        field.onChange(currentSelection.filter(uid => uid !== student.uid));
                                      } else {
                                        field.onChange([...currentSelection, student.uid]);
                                      }
                                    }}
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(student.uid)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                    />
                                    {student.name}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
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
                        disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading || isGenerating}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
