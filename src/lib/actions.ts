'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import type { Project, Task, ProjectStatus, AssignedStudent } from './types';

type ProjectInput = Omit<
  Project,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;

export async function createProject(projectInput: ProjectInput) {
  try {
    const { assignedTo, ...restOfProject } = projectInput;
    await addDoc(collection(db, 'projects'), {
      ...restOfProject,
      assignedTo,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const studentNames = projectInput.assignedTo.map(s => s.name).join(', ');

    await addDoc(collection(db, 'activity_logs'), {
      action: `Project "${projectInput.title}" created and assigned to ${studentNames}`,
      timestamp: serverTimestamp(),
      userId: projectInput.createdBy,
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  userId: string
) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    const projectSnapshot = await getDoc(projectRef);
    const projectTitle = projectSnapshot.data()?.title || 'a project';

    await addDoc(collection(db, 'activity_logs'), {
      projectId,
      userId,
      action: `Status of project "${projectTitle}" changed to ${status}`,
      timestamp: serverTimestamp(),
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function createTask(taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
        await addDoc(collection(db, 'tasks'), {
            ...taskInput,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
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

    const taskSnapshot = await getDoc(taskRef);
    const taskTitle = taskSnapshot.data()?.title || 'a task';

    await addDoc(collection(db, 'activity_logs'), {
      taskId,
      userId,
      action: `Status of task "${taskTitle}" changed to ${status}`,
      timestamp: serverTimestamp(),
    });

    revalidatePath('/dashboard'); // May need to revalidate a more specific path
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
