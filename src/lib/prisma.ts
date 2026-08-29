import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use standard PrismaClient but explicitly pass the URL since it's omitted in Prisma 7 schema
export const prisma =
  globalForPrisma.prisma || new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy'
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
