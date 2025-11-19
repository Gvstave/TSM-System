'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { Task, User } from '@/lib/types';
import { prioritizeTasksForLecturer } from '@/ai/flows/task-prioritization-for-lecturers';
import type { TaskPrioritizationForLecturerOutput } from '@/ai/flows/task-prioritization-for-lecturers';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface AiLecturerPrioritizerProps {
  tasks: Task[];
  students: User[];
}

const priorityColors: { [key: string]: string } = {
    High: 'bg-destructive/20 text-destructive-foreground border-destructive/50',
    Medium: 'bg-primary/20 text-primary-foreground border-primary/50',
    Low: 'bg-secondary text-secondary-foreground',
}

export function AiLecturerPrioritizer({ tasks, students }: AiLecturerPrioritizerProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TaskPrioritizationForLecturerOutput | null>(
    null
  );
  const { toast } = useToast();

  const handlePrioritize = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const activeTasks = tasks.filter((t) => t.status !== 'Completed');
       if (activeTasks.length === 0) {
        toast({
            title: "No active tasks",
            description: "There are no tasks to prioritize.",
        });
        setIsLoading(false);
        return;
      }

      const studentWorkloads = students.map(student => ({
        studentId: student.uid,
        taskCount: tasks.filter(t => t.assignedTo === student.uid && t.status !== 'Completed').length,
      }));

      const input = {
        tasks: activeTasks.map(t => ({
          taskId: t.id,
          title: t.title,
          description: t.description,
          deadline: t.deadline.toDate().toISOString().split('T')[0],
          studentId: t.assignedTo,
        })),
        studentWorkloads,
      };

      const aiResult = await prioritizeTasksForLecturer(input);
      setResult(aiResult);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Prioritization Failed',
        description: 'Could not get suggestions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskTitle = (taskId: string) => tasks.find(t => t.id === taskId)?.title || "Unknown Task";
  const getStudentName = (studentId: string) => students.find(s => s.uid === studentId)?.name || "Unknown Student";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" /> AI Prioritization Suggestions
          </DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions to help students prioritize their tasks.
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <p className="text-center text-muted-foreground">Click the button below to generate task priority suggestions for all active students.</p>
            <Button onClick={handlePrioritize} disabled={isLoading} className="w-1/2">
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Suggestions
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <ScrollArea className="h-[400px] space-y-4 pr-4">
                {result.prioritySuggestions.map((suggestion, index) => (
                    <div key={index} className="mb-4 rounded-lg border p-4">
                        <div className="flex justify-between items-start">
                           <div>
                             <h4 className="font-semibold">{getTaskTitle(suggestion.taskId)}</h4>
                             <p className="text-sm text-muted-foreground">For: {getStudentName(suggestion.studentId)}</p>
                           </div>
                           <Badge className={cn(priorityColors[suggestion.priority] || 'bg-secondary')}>
                             {suggestion.priority} Priority
                           </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-md">
                           <p><span className="font-semibold">Reason:</span> {suggestion.reason}</p>
                        </div>
                    </div>
                ))}
            </ScrollArea>
            <Button variant="secondary" onClick={() => {setResult(null); setOpen(false)}} className="w-full mt-4">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
