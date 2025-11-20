# Report: Task Management & Scheduling System (TMS)

## 1. About The Project

The Task Management & Scheduling System (TMS) is a full-stack, AI-enhanced application designed to streamline academic project management. Built for educational environments, it provides a dedicated platform for lecturers to create, assign, and monitor projects, and for students to manage their assigned tasks effectively.

The core goal is to bridge the communication and organizational gap between educators and students, ensuring clarity in project requirements and visibility into progress. By leveraging AI, the system also aids in the initial planning stages, helping to break down large projects into actionable steps.

---

## 2. Key Features

The application offers a distinct set of features tailored to the two main user roles: Lecturers and Students.

### For Lecturers

- **Secure Authentication**: Safe and secure sign-up and login functionality.
- **Project Creation & Assignment**: A simple interface to create new projects with a title, detailed description, and a firm deadline. Projects can be assigned to one or multiple students.
- **AI-Powered Task Generation**: Upon creating a project, lecturers can use an integrated AI assistant to automatically suggest a list of initial, actionable tasks. This provides students with a structured and well-defined starting point.
- **Centralized Dashboard**: A comprehensive dashboard to view all created projects. Projects can be filtered by status (Pending, In Progress, Completed) and searched by title for quick access.
- **Real-Time Progress Monitoring**: Lecturers can open any project to view its associated tasks, see the status of each task, and read comments, offering a clear and up-to-date overview of student progress without needing constant check-ins.
- **Project Lifecycle Management**: Ability to delete projects, which removes all associated tasks and data permanently.

### For Students

- **Secure Authentication**: Students can sign up and associate their account with a specific lecturer, ensuring they are placed in the correct academic context.
- **Personalized Dashboard**: Upon logging in, students see a personalized dashboard displaying only the projects assigned specifically to them. This view is also filterable by project status.
- **Complete Task Management**:
    - View all tasks and subtasks for a given project.
    - Create new tasks to further organize their workflow.
    - Update the status of each task (`Pending`, `In Progress`, `Completed`) to reflect their progress.
- **AI-Powered Task Breakdown**: When tackling a large project, students can use an AI assistant to get suggestions on how to break down complex tasks into smaller, more manageable subtasks.
- **Task-Specific Commenting**: A commenting system is available on every task, allowing students to ask questions, provide updates, or leave notes for themselves or the lecturer.
- **Project Submission**: Once all tasks within a project are marked as "Completed," students can formally submit the project for review, which updates its status accordingly.

---

## 3. How to Use the Application

### Lecturer Workflow

1.  **Sign Up**: Create an account by selecting the "Lecturer" role.
2.  **Create a Project**: From the dashboard, click "Create Project". Fill in the title, description, and deadline. Use the AI to generate initial tasks if desired.
3.  **Assign Students**: Select one or more students from the list of students associated with you.
4.  **Monitor Progress**: View your created projects on the dashboard. Click on any project card to open the "Task Management" view, where you can see task statuses and comments in read-only mode.
5.  **Review**: Once a student submits a project, its status will change to "Completed".

### Student Workflow

1.  **Sign Up**: Create an account by selecting the "Student" role and choosing your lecturer from the dropdown list.
2.  **View Your Projects**: Your dashboard will show all projects assigned to you by your lecturer.
3.  **Manage Tasks**: Click "Manage Tasks" on a project card to view the task list.
    - Update task statuses as you work on them.
    - Add new tasks or sub-tasks to organize your work.
    - Use the "Generate AI Task Suggestions" button if you need help breaking down the project further.
    - Add comments to tasks to ask questions or leave notes.
4.  **Submit Project**: Once you have completed all tasks in a project, the "Submit Project" button will become enabled. Click it to finalize your submission.

---

## 4. Technology Stack & Rationale

The technology stack was carefully chosen to create a modern, performant, and scalable web application.

- **Framework**: **Next.js (with App Router)**
    - **Why?**: Next.js provides a powerful hybrid approach with Server Components and Server Actions. This reduces the amount of JavaScript sent to the client, leading to faster page loads and a better user experience. The App Router simplifies routing and layout management.

- **Styling**: **Tailwind CSS & shadcn/ui**
    - **Why?**: Tailwind CSS is a utility-first framework that allows for rapid UI development without writing custom CSS. `shadcn/ui` provides a set of beautifully designed, accessible, and unstyled components that are easily customizable, accelerating development while maintaining a high-quality, professional look.

- **Authentication**: **Firebase Authentication**
    - **Why?**: Firebase Auth is a secure, easy-to-implement, and scalable authentication solution. It handles the complexities of user management, password security, and session persistence, allowing developers to focus on core application features.

- **Database**: **Firestore**
    - **Why?**: Firestore is a flexible, scalable NoSQL database that offers real-time data synchronization out of the box. This is perfect for a collaborative application like TMS, as changes made by one user (e.g., updating a task status) are reflected instantly for other users without needing manual refreshes.

- **Generative AI**: **Google's Gemini Models via Genkit**
    - **Why?**: Genkit provides a streamlined and structured way to integrate powerful generative AI capabilities into the application. By using Google's Gemini models, the app can offer intelligent features like task suggestion and breakdown, enhancing the user experience and providing genuine value.

- **Deployment**: **Firebase App Hosting**
    - **Why?**: Firebase App Hosting is a fully managed, serverless platform optimized for hosting Next.js applications. It provides a seamless deployment experience with features like automatic CI/CD, global CDN, and integration with other Firebase services.

---

## 5. Getting Started (For Developers)

1.  **Clone the repository.**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Firebase**:
    - Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
    - Enable Firestore and Firebase Authentication (with the Email/Password provider).
    - Get your Firebase project configuration keys and place them in a `.env` file at the root of the project. See the existing `.env` file for the required variable names.
4.  **Run the development server**:
    ```bash
    next dev
    ```
    The application will be available at `http://localhost:9002`.
