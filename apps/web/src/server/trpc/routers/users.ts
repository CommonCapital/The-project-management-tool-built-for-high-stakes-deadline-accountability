import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "..";
import { users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const usersRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.users.findMany({
      where: eq(users.orgId, ctx.user.orgId || ""),
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isActive: true,
      },
    });
  }),

  updateRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["admin", "manager", "member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users)
        .set({ role: input.role })
        .where(and(
          eq(users.id, input.userId),
          eq(users.orgId, ctx.user.orgId || "")
        ));
      return { success: true };
    }),
});
