import { PrismaClient } from '@prisma/client';

// Create a global object for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use the existing Prisma client if available, otherwise create a new one
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// In development, store the Prisma client in the global object to reuse
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
