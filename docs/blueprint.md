# **App Name**: TMS

## Core Features:

- User Authentication: Secure user authentication with Firebase using email/password. On signup, user data (uid, name, email, role) is stored in Firestore.
- Lecturer Task Creation: Lecturers can create tasks with title, description, deadline, and assign them to students.
- Student Task Management: Students can view assigned tasks and update their status (Pending, In Progress, Completed).
- Task Progress Tracking: Lecturers can view the progress of all tasks and student performance.
- Activity Logging: Log all task updates to Firestore to track changes and maintain an audit trail (taskId, userId, action, timestamp).
- Deadline Reminders: Provide visual cues, such as changing colors and/or icons to inform the user when a deadline is approaching
- Mobile-Responsive UI: Implement a fully responsive UI using Tailwind CSS for seamless experience across devices.
- AI-Powered Task Prioritization: An AI tool analyzes task descriptions, deadlines, and student workload to suggest optimal task prioritization for both lecturers and students. The AI tool uses reasoning to incorporate relevant information into its suggestions.

## Style Guidelines:

- Primary color: White (#FFFFFF) to convey clarity and simplicity.
- Secondary color: Pastel / Wild Red (#FF6961) for alerts and important actions.
- Background color: Whitesmoke (#F5F5F5), providing a clean, uncluttered backdrop.
- Accent color: Orange (#FFA500) for interactive elements, drawing attention and providing visual interest.
- Body font: 'Inter' sans-serif for a modern, neutral, and readable feel.
- Headline font: 'Space Grotesk' sans-serif for a techy, slightly futuristic aesthetic that complements the clean UI. Use 'Inter' for body.
- Use a consistent set of modern icons to represent different task statuses and actions.
- Employ a card-based layout with clear spacing and visual hierarchy to organize tasks and information effectively.
- Implement subtle transitions and animations on task updates and interactions to provide visual feedback and enhance user experience.