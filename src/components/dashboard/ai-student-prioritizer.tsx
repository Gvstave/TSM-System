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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { Project } from '@/lib/types';
import { prioritizeTasksForStudent } from '@/ai/flows/task-prioritization-for-students';
import type { PrioritizeTasksForStudentOutput } from '@/ai/flows/task-prioritization-for-students';
import { Timestamp } from 'firebase/firestore';

interface AiStudentPrioritizerProps {
  projects: Project[];
}

const getDeadlineAsDate = (deadline: Project['deadline']): Date => {
  if (deadline instanceof Timestamp) {
    return deadline.toDate();
  }
  if (deadline && typeof deadline.seconds === 'number') {
    return new Timestamp(deadline.seconds, deadline.nanoseconds).toDate();
  }
  return new Date();
};


export function AiStudentPrioritizer({ projects: tasks }: AiStudentPrioritizerProps) {
  const [open, setOpen] = useState(false);
  const [workload, setWorkload] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PrioritizeTasksForStudentOutput | null>(
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
            title: "No active projects",
            description: "There are no projects to prioritize.",
        });
        setIsLoading(false);
        return;
      }

      const input = {
        taskDescriptions: activeTasks.map(t => t.title),
        deadlines: activeTasks.map(t => getDeadlineAsDate(t.deadline).toISOString()),
        studentWorkload: workload || 'No additional workload specified.',
      };

      const aiResult = await prioritizeTasksForStudent(input);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Prioritize with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" /> AI Project Prioritizer
          </DialogTitle>
          <DialogDescription>
            Let AI help you organize your projects based on urgency and your current workload.
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <div className="space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="workload">
                Any other commitments or workload to consider?
              </Label>
              <Textarea
                placeholder="e.g., 'I have a part-time job on weekends' or 'I need to study for a chemistry exam'."
                id="workload"
                value={workload}
                onChange={(e) => setWorkload(e.target.value)}
              />
            </div>
            <Button onClick={handlePrioritize} disabled={isLoading} className="w-full">
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Get Suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
             <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Wand2 size={16} /> Reasoning</h3>
                <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{result.reasoning}</p>
             </div>
             <div>
                <h3 className="font-semibold mb-2">Suggested Order</h3>
                <ol className="list-decimal list-inside space-y-1 rounded-md border p-3">
                    {result.prioritizedTasks.map((task, index) => (
                        <li key={index} className="text-sm">{task}</li>
                    ))}
                </ol>
             </div>
             <Button variant="secondary" onClick={() => setResult(null)} className="w-full">Start Over</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
