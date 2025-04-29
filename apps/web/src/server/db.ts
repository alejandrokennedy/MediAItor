import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

/**
 * Create a new PrismaClient instance
 */
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize Prisma client only once and reuse it across requests
const getDb = () => {
  // Check if we already have a Prisma client instance
  if (!globalForPrisma.prisma) {
    // Create a new client if none exists
    globalForPrisma.prisma = createPrismaClient();
    
    // Store in global only in non-production environments
    if (env.NODE_ENV !== "production") {
      globalForPrisma.prisma = globalForPrisma.prisma;
    }
  }
  
  return globalForPrisma.prisma;
};

// Export the db client
export const db = getDb();

// // OLD CODE
// const createPrismaClient = () =>
//   new PrismaClient({
//     log:
//       env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   });

// const globalForPrisma = globalThis as unknown as {
//   prisma: ReturnType<typeof createPrismaClient> | undefined;
// };

// export const db = globalForPrisma.prisma ?? createPrismaClient();

// if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
