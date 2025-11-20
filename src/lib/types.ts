import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer';
  lecturerId?: string; // Optional, only for students
};

export const ProjectStatusSchema = z.enum(['Pending', 'In Progress', 'Completed']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export type AssignedStudent = {
  id: string;
  name: string;
};

export type Project = {
  id:string;
  title: string;
  description: string;
  deadline: Timestamp;
  assignedTo: string[]; // This should always be an array of student UIDs.
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
    dueDate?: Timestamp;
    grade?: number;
    parentId?: string;
    subtasks?: Task[];
}
