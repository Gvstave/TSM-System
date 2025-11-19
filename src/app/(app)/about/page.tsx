import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { Users, BookOpenCheck } from 'lucide-react';
  
  export default function AboutPage() {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
                About the Task Management System
            </h2>
            <p className="text-muted-foreground">
                A streamlined solution for managing academic projects and tasks.
            </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Users className="text-primary"/> For Lecturers
                    </CardTitle>
                    <CardDescription>
                        Efficiently create, assign, and monitor student projects.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                   <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Create detailed projects with descriptions and deadlines.</li>
                        <li>Assign projects to individual students or groups in your class.</li>
                        <li>Monitor project status (Pending, In Progress, Completed) from a centralized dashboard.</li>
                        <li>View task breakdowns for each project to see student progress.</li>
                        <li>Leverage AI to get prioritization suggestions based on deadlines and student workloads.</li>
                   </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <BookOpenCheck className="text-primary" /> For Students
                    </CardTitle>
                    <CardDescription>
                        Organize, prioritize, and complete your assigned projects.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Receive project assignments from your lecturer in one place.</li>
                        <li>Break down large projects into smaller, manageable tasks.</li>
                        <li>Update the status of each task as you work on it.</li>
                        <li>Use the AI Prioritizer to get smart suggestions on what to work on next.</li>
                        <li>Submit your project for review once all tasks are completed.</li>
                   </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }
  