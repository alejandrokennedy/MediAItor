import { TRPCError } from "@trpc/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
  // Create a new session
  createSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Get current user from Clerk
        const user = await currentUser();

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated"
          });
        }

        // Get the database user record
        const dbUser = await ctx.db.user.findUnique({
          where: { clerkId: user.id }
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database"
          });
        }

        // Create the session with default values
        const session = await ctx.db.session.create({
          data: {
            // No title for now, using default null from schema
            isSolo: false, // Default to multi-user session
            stage: "MAIN", // Default stage
            // Add the creator as first participant
            participants: {
              create: {
                userId: dbUser.id,
                status: "ACTIVE"
              }
            }
          },
          include: {
            participants: true
          }
        });

        return {
          sessionId: session.id,
          url: `/session/${session.id}` // For easy redirection/sharing
        };
      } catch (error) {
        console.error("Error creating session:", error);
        if (error instanceof TRPCError) {
          throw error; // Re-throw tRPC errors
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session"
        });
      }
    }),

  // Get a session by ID
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get current user from Clerk
        const user = await currentUser();

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated"
          });
        }

        // Get the database user record
        const dbUser = await ctx.db.user.findUnique({
          where: { clerkId: user.id }
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database"
          });
        }

        // Find the session
        const session = await ctx.db.session.findUnique({
          where: { id: input.sessionId },
          include: {
            participants: true,
            messages: {
              orderBy: { createdAt: "asc" }
            }
          }
        });

        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found"
          });
        }

        // Check if user is a participant (invite-only security)
        const isParticipant = session.participants.some(
          participant => participant.userId === dbUser.id
        );

        if (!isParticipant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a participant in this session"
          });
        }

        return session;
      } catch (error) {
        console.error("Error getting session:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get session"
        });
      }
    })
});