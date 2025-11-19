'use server';

/**
 * @fileOverview AI-powered task prioritization for lecturers.
 *
 * - prioritizeTasksForLecturer - A function that suggests optimal task prioritization for lecturers.
 * - TaskPrioritizationForLecturerInput - The input type for the prioritizeTasksForLecturer function.
 * - TaskPrioritizationForLecturerOutput - The return type for the prioritizeTasksForLecturer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('A detailed description of the task.'),
  deadline: z.string().describe('The deadline for the task (e.g., YYYY-MM-DD).'),
  studentId: z.string().describe('The ID of the student assigned to the task.'),
});

const StudentWorkloadSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  taskCount: z.number().describe('The number of tasks currently assigned to the student.'),
});

const TaskPrioritizationForLecturerInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of tasks to be prioritized.'),
  studentWorkloads: z.array(StudentWorkloadSchema).describe('A list of student workloads.'),
});
export type TaskPrioritizationForLecturerInput = z.infer<typeof TaskPrioritizationForLecturerInputSchema>;

const TaskPrioritySuggestionSchema = z.object({
  taskId: z.string().describe('The ID of the task.'),
  studentId: z.string().describe('The ID of the student assigned to the task.'),
  priority: z.string().describe('Suggested priority for the task (High, Medium, Low).'),
  reason: z.string().describe('The reasoning behind the priority suggestion.'),
});

const TaskPrioritizationForLecturerOutputSchema = z.object({
  prioritySuggestions: z.array(TaskPrioritySuggestionSchema).describe('A list of task priority suggestions.'),
});
export type TaskPrioritizationForLecturerOutput = z.infer<typeof TaskPrioritizationForLecturerOutputSchema>;

export async function prioritizeTasksForLecturer(
  input: TaskPrioritizationForLecturerInput
): Promise<TaskPrioritizationForLecturerOutput> {
  return prioritizeTasksForLecturerFlow(input);
}

const taskPrioritizationPrompt = ai.definePrompt({
  name: 'taskPrioritizationPrompt',
  input: {schema: TaskPrioritizationForLecturerInputSchema},
  output: {schema: TaskPrioritizationForLecturerOutputSchema},
  prompt: `You are an AI assistant helping lecturers prioritize tasks for their students.

  Analyze the task descriptions, deadlines, and student workloads to suggest an optimal task prioritization for each student.
  Consider the following factors when determining priority:
  - Urgency: Tasks with approaching deadlines should be prioritized higher.
  - Importance: Tasks with more complex descriptions or significant impact should be prioritized higher.
  - Student Workload: Students with heavier workloads should have their tasks prioritized more carefully.

  Tasks:
  {{#each tasks}}
  - Task ID: {{this.title}}, Description: {{this.description}}, Deadline: {{this.deadline}}, Student ID: {{this.studentId}}
  {{/each}}

  Student Workloads:
  {{#each studentWorkloads}}
  - Student ID: {{this.studentId}}, Task Count: {{this.taskCount}}
  {{/each}}

  Provide a priority suggestion (High, Medium, Low) and a brief reason for each task, considering both urgency and student workload. Return in JSON format.
  Ensure that the taskId and studentId in prioritySuggestions match the IDs provided in the input.

  Prioritization Suggestions:
  {
    "prioritySuggestions": [
      {{#each tasks}}
      {
        "taskId": "{{this.title}}",
        "studentId": "{{this.studentId}}",
        "priority": "",
        "reason": ""
      }{{/if}}
      {{/each}}
    ]
  }
  `,
});

const prioritizeTasksForLecturerFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksForLecturerFlow',
    inputSchema: TaskPrioritizationForLecturerInputSchema,
    outputSchema: TaskPrioritizationForLecturerOutputSchema,
  },
  async input => {
    const {output} = await taskPrioritizationPrompt(input);
    return output!;
  }
);
