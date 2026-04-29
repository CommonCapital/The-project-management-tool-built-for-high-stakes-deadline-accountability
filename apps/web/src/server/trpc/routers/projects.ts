import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "..";
import { projects, projectMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.projects.findMany({
      where: eq(projects.orgId, ctx.user.orgId || ""),
      with: {
        // We'll add relations later if needed
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.id),
          eq(projects.orgId, ctx.user.orgId || "")
        ),
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return project;
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      deadline: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const [project] = await ctx.db.insert(projects).values({
        id,
        orgId: ctx.user.orgId || "",
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        deadline: input.deadline,
        createdBy: ctx.user.id,
      }).returning();

      return project;
    }),
    
  // More procedures to be added...
});
