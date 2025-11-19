'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
  Timestamp,
  query,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import type { Project, Task, ProjectStatus, AssignedStudent } from './types';

// The input for the server action must be a plain object.
// The deadline is passed as an ISO string.
type ProjectInputAction = {
  title: string;
  description: string;
  deadline: string; // ISO string
  assignedTo: string[]; // Array of student UIDs
  createdBy: string;
};

export async function createProject(projectInput: ProjectInputAction) {
  try {
    const { deadline, ...restOfProject } = projectInput;

    // Convert the ISO string back to a Firestore Timestamp on the server.
    const deadlineTimestamp = Timestamp.fromDate(new Date(deadline));

    await addDoc(collection(db, 'projects'), {
      ...restOfProject,
      deadline: deadlineTimestamp,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'activity_logs'), {
      action: `Project "${projectInput.title}" created`,
      timestamp: serverTimestamp(),
      userId: projectInput.createdBy,
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProject(projectId: string, userId: string) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    const projectTitle = projectSnap.data()?.title || 'a project';
    const batch = writeBatch(db);

    // Find and delete all tasks associated with the project
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach((taskDoc) => {
      batch.delete(taskDoc.ref);
    });

    // Delete the project itself
    batch.delete(projectRef);

    await batch.commit();

    await addDoc(collection(db, 'activity_logs'), {
      projectId,
      userId,
      action: `Project "${projectTitle}" deleted`,
      timestamp: serverTimestamp(),
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

export async function createTask(
  taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
) {
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
