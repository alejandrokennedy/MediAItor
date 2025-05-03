import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { currentUser } from '@clerk/nextjs/server';

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  syncCurrentUser: protectedProcedure.mutation(async ({ ctx }) => {
    // Get the current user from Clerk
    const user = await currentUser()

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // Basic implementation to check if user exists
    const existingUser = await ctx.db.user.findUnique({
      where: { clerkId: user.id }
    })
    
    return {
      exists: Boolean(existingUser),
      userId: user.id
    }
  })
})