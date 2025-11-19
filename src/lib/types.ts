import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer';
};

export const TaskStatusSchema = z.enum(['Pending', 'In Progress', 'Completed']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: Timestamp;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  status: TaskStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
