import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const databaseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.RENDER_DB
    : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export { prisma };
