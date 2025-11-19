'use server';
/**
 * @fileOverview An AI agent for task prioritization for students.
 *
 * - prioritizeTasksForStudent - A function that suggests an optimal task prioritization for a student.
 * - PrioritizeTasksForStudentInput - The input type for the prioritizeTasksForStudent function.
 * - PrioritizeTasksForStudentOutput - The return type for the prioritizeTasksForStudent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeTasksForStudentInputSchema = z.object({
  taskDescriptions: z.array(z.string()).describe('An array of task descriptions.'),
  deadlines: z.array(z.string()).describe('An array of task deadlines in ISO format.'),
  studentWorkload: z.string().describe('The student\u2019s current workload description.'),
});
export type PrioritizeTasksForStudentInput = z.infer<
  typeof PrioritizeTasksForStudentInputSchema
>;

const PrioritizeTasksForStudentOutputSchema = z.object({
  prioritizedTasks: z
    .array(z.string())
    .describe('An array of task descriptions ordered by priority.'),
  reasoning: z.string().describe('The reasoning behind the suggested prioritization.'),
});
export type PrioritizeTasksForStudentOutput = z.infer<
  typeof PrioritizeTasksForStudentOutputSchema
>;

export async function prioritizeTasksForStudent(
  input: PrioritizeTasksForStudentInput
): Promise<PrioritizeTasksForStudentOutput> {
  return prioritizeTasksForStudentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeTasksForStudentPrompt',
  input: {schema: PrioritizeTasksForStudentInputSchema},
  output: {schema: PrioritizeTasksForStudentOutputSchema},
  prompt: `You are an AI assistant helping students prioritize their tasks.

Given the following task descriptions, deadlines, and the student's current workload, suggest an optimal task prioritization.
Explain the reasoning behind the suggested prioritization.

Task Descriptions:
{{#each taskDescriptions}}- {{this}}\n{{/each}}

Deadlines:
{{#each deadlines}}- {{this}}\n{{/each}}

Current Workload: {{{studentWorkload}}}

Consider the deadlines, task descriptions, and the student's current workload to provide the most effective prioritization.
Output the prioritized tasks and the reasoning behind the suggested order.
`,
});

const prioritizeTasksForStudentFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksForStudentFlow',
    inputSchema: PrioritizeTasksForStudentInputSchema,
    outputSchema: PrioritizeTasksForStudentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
