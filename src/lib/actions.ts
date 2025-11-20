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
import type { Project, Task, ProjectStatus, AssignedStudent, Comment } from './types';

// The input for the server action must be a plain object.
// The deadline is passed as an ISO string.
type ProjectInputAction = {
  title: string;
  description: string;
  deadline: string; // ISO string
  assignedTo: string[]; // Array of student UIDs
  createdBy: string;
  tasks?: string[]; // Optional array of task titles
};

export async function createProject(projectInput: ProjectInputAction) {
  try {
    const { deadline, tasks, ...restOfProject } = projectInput;

    const batch = writeBatch(db);

    // 1. Create the project
    const projectRef = doc(collection(db, 'projects'));
    const deadlineTimestamp = Timestamp.fromDate(new Date(deadline));

    batch.set(projectRef, {
      ...restOfProject,
      deadline: deadlineTimestamp,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. If there are tasks, create them
    if (tasks && tasks.length > 0) {
      for (const taskTitle of tasks) {
        const taskRef = doc(collection(db, 'tasks'));
        batch.set(taskRef, {
          projectId: projectRef.id,
          title: taskTitle,
          status: 'Pending',
          createdBy: projectInput.createdBy, // The lecturer is creating these initial tasks
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
       // If tasks are being added, the project is immediately "In Progress"
       batch.update(projectRef, { status: 'In Progress' });
    }

    await batch.commit();

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProject(projectId: string, userId: string) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const batch = writeBatch(db);

    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const tasksSnapshot = await getDocs(tasksQuery);

    for (const taskDoc of tasksSnapshot.docs) {
      const commentsQuery = query(collection(taskDoc.ref, 'comments'));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });
      batch.delete(taskDoc.ref);
    }
    
    batch.delete(projectRef);
    await batch.commit();

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

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

type TaskInputAction = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'dueDate' | 'subtasks'> & {
  dueDate?: string; // ISO string
};


export async function createTask(
  taskInput: TaskInputAction
) {
  try {
    const projectRef = doc(db, 'projects', taskInput.projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found.');
    }

    const projectData = projectSnap.data();

    const { dueDate, ...restOfTask } = taskInput;
    const taskData: any = {
        ...restOfTask,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    if (dueDate) {
        taskData.dueDate = Timestamp.fromDate(new Date(dueDate));
    }


    // Start a batch to perform multiple writes atomically
    const batch = writeBatch(db);

    // 1. Add the new task
    const taskRef = doc(collection(db, 'tasks'));
    batch.set(taskRef, taskData);

    // 2. If project is 'Pending', update it to 'In Progress'
    if (projectData.status === 'Pending') {
      batch.update(projectRef, {
        status: 'In Progress',
        updatedAt: serverTimestamp(),
      });
    }

    // Commit the batch
    await batch.commit();

    revalidatePath('/dashboard');
    return { success: true, updatedProjectStatus: projectData.status === 'Pending' };
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

    revalidatePath('/dashboard'); // May need to revalidate a more specific path
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

type CommentInputAction = {
    taskId: string;
    userId: string;
    userName: string;
    userImage?: string;
    text: string;
};

export async function addCommentToTask(commentInput: CommentInputAction) {
    try {
        const { taskId, ...commentData } = commentInput;
        const commentsCollectionRef = collection(db, 'tasks', taskId, 'comments');
        await addDoc(commentsCollectionRef, {
            ...commentData,
            createdAt: serverTimestamp(),
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
