import { createTRPCRouter } from ".";
import { tasksRouter } from "./routers/tasks";
import { projectsRouter } from "./routers/projects";
import { chatRouter } from "./routers/chat";
import { notificationsRouter } from "./routers/notifications";
import { usersRouter } from "./routers/users";
import { analyticsRouter } from "./routers/analytics";

// Placeholder routers to be implemented later
const placeholderRouter = createTRPCRouter({});

export const appRouter = createTRPCRouter({
  tasks: tasksRouter,
  projects: projectsRouter,
  chat: chatRouter,
  notifications: notificationsRouter,
  users: usersRouter,
  analytics: analyticsRouter,
  calendar: placeholderRouter,
  files: placeholderRouter,
});

export type AppRouter = typeof appRouter;
