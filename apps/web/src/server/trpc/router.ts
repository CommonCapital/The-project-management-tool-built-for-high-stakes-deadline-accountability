import { createTRPCRouter } from ".";
import { tasksRouter } from "./routers/tasks";
import { projectsRouter } from "./routers/projects";
import { chatRouter } from "./routers/chat";
import { notificationsRouter } from "./routers/notifications";
import { usersRouter } from "./routers/users";
import { analyticsRouter } from "./routers/analytics";
import { workspacesRouter } from "./routers/workspaces";

export const appRouter = createTRPCRouter({
  tasks: tasksRouter,
  projects: projectsRouter,
  chat: chatRouter,
  notifications: notificationsRouter,
  users: usersRouter,
  analytics: analyticsRouter,
  workspaces: workspacesRouter,
});

export type AppRouter = typeof appRouter;
