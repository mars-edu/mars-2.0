import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { D1Database } from "@cloudflare/workers-types";

let prismaClient: PrismaClient | null = null;

export function getPrismaClient(env: { DB: D1Database }) {
  if (!env?.DB) {
    throw new Error("D1 database binding not available");
  }

  if (!prismaClient) {
    const adapter = new PrismaD1(env.DB);
    prismaClient = new PrismaClient({
      adapter,
    });
  }

  return prismaClient;
}

export function disconnectPrisma() {
  if (prismaClient) {
    prismaClient.$disconnect();
    prismaClient = null;
  }
}
