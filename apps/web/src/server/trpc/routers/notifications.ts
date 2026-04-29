import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "..";
import { notifications } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.orgId, ctx.user.orgId || "")
        ),
        limit: input.limit,
        orderBy: [desc(notifications.createdAt)],
      });
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, ctx.user.id),
        eq(notifications.isRead, false)
      ),
    });
    return result.length;
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),
});
