'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { Task, User } from './types';

type TaskInput = Omit<
  Task,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'assignedToName'
> & {
  assignedStudent: {
    id: string;
    name: string;
  };
};

export async function createTask(taskInput: TaskInput) {
  try {
    const { assignedStudent, ...rest } = taskInput;
    await addDoc(collection(db, 'tasks'), {
      ...rest,
      assignedTo: assignedStudent.id,
      assignedToName: assignedStudent.name,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'activity_logs'), {
      action: `Task "${taskInput.title}" created and assigned to ${assignedStudent.name}`,
      timestamp: serverTimestamp(),
      userId: taskInput.createdBy,
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: Task['status'],
  userId: string
) {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    const taskSnapshot = await (
      await import('firebase/firestore')
    ).getDoc(taskRef);
    const taskTitle = taskSnapshot.data()?.title || 'a task';

    await addDoc(collection(db, 'activity_logs'), {
      taskId,
      userId,
      action: `Status of task "${taskTitle}" changed to ${status}`,
      timestamp: serverTimestamp(),
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
