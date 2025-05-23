import { TRPCError } from "@trpc/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

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
    }),

    joinSession: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        // Later we might add inviteCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify the user is authenticated (handled by protectedProcedure)
          const user = await currentUser();

          if (!user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Not authenticated",
            });
          }

          const dbUser = await ctx.db.user.findUnique({
            where: { clerkId: user.id },
          });

          if (!dbUser) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found in database",
            });
          }

          // Check if the session exists, and whether the current user is active in it
          const sessionWithUserCheck = await ctx.db.session.findUnique({
            where: { id: input.sessionId },
            include: {
              participants: {
                where: { userId: dbUser.id },
              },
            },
          });

          if (!sessionWithUserCheck) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Session not found",
            });
          }

          if (sessionWithUserCheck.participants.length) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "User is already active in session",
            });
          }

          // Add the user as a participant
          await ctx.db.sessionParticipant.create({
            data: {
              session: {
                connect: { id: input.sessionId },
              },
              user: {
                connect: { id: dbUser.id },
              },
              status: "ACTIVE",
            },
          });

          // Return session data
          return {
            sessionId: input.sessionId,
            sessionURL: `/session/${input.sessionId}`,
          };
        } catch (error) {
          console.error('Error joining session: ', error)
          if (error instanceof TRPCError) {
            throw error
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to join session"
          })
        }
      })
});