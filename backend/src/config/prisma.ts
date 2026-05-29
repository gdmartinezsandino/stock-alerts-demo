import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the whole process.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
