import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "..";
import { channels, messages, channelMembers } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    // This is a simplified version; in reality we'd check channel_members
    return await ctx.db.query.channels.findMany({
      where: eq(channels.orgId, ctx.user.orgId || ""),
    });
  }),

  getMessages: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(), // timestamp or ID
    }))
    .query(async ({ ctx, input }) => {
      // Fetch messages for channel
      return await ctx.db.query.messages.findMany({
        where: eq(messages.channelId, input.channelId),
        limit: input.limit,
        orderBy: [desc(messages.createdAt)],
        with: {
          // user: true, // We'll add this to schema relations later
        }
      });
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const [message] = await ctx.db.insert(messages).values({
        id,
        channelId: input.channelId,
        userId: ctx.user.id,
        content: input.content,
      }).returning();

      // Real-time broadcast will happen here via Redis pub/sub 
      // when we implement the WebSocket server.

      return message;
    }),
});
