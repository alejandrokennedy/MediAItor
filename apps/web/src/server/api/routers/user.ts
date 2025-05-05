import { TRPCError } from '@trpc/server'
import { currentUser } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  syncCurrentUser: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Get the current user from Clerk
      const user = await currentUser()

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const clerkId = user.id;
      
      // Basic implementation to check if user exists
      const existingUser = await ctx.db.user.findUnique({
        where: { clerkId }
      })
      
      // If user already exists, return info
      if (existingUser) {
        return {
          status: "existing",
          user: existingUser,
        };
      }
      
      // User doesn't exist, so create them in the database
      
      // Find primary email from Clerk user
      const primaryEmailId = user.primaryEmailAddressId;
      const emailObject = user.emailAddresses.find(
        email => email.id === primaryEmailId
      );
      
      if (!emailObject) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not have a primary email address",
        });
      }
      
      // Extract name from Clerk user data
      const firstName = user.firstName ?? "";
      const lastName = user.lastName ?? "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      
      // Create new user in database
      const newUser = await ctx.db.user.create({
        data: {
          clerkId,
          email: emailObject.emailAddress,
          name: fullName || null,  // Use null if name is empty
        },
      });
      
      return {
        status: "created",
        user: newUser,
      };
    } catch (error) {
      // Handle known error types
      if (error instanceof TRPCError) {
        throw error; // Re-throw tRPC errors
      }
      
      // Log the error for debugging
      console.error("Error in syncCurrentUser:", error);
      
      // If it's a database unique constraint error
      if (
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }
      
      // Default error
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to sync user",
      });
    }
  }),
  
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    try {
      const user = await currentUser()
      if (!user) return null;

      const dbUser = await ctx.db.user.findUnique({
        where: { clerkId: user.id }
      });
      
      return dbUser;
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get current user",
      });
    }
  })
})