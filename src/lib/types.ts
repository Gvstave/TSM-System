import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer';
};

export const ProjectStatusSchema = z.enum(['Pending', 'In Progress', 'Completed']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export type Project = {
  id: string;
  title: string;
  description: string;
  deadline: Timestamp;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  status: ProjectStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  grade?: number;
};

export const TaskStatusSchema = z.enum(['Pending', 'In Progress', 'Completed']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export type Task = {
    id: string;
    projectId: string;
    title: string;
    status: TaskStatus;
    createdBy: string; // student's uid
    createdAt: Timestamp;
    updatedAt: Timestamp;
    grade?: number;
}
