import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { D1Database } from "@cloudflare/workers-types";

export function getPrismaClient(env: { DB: D1Database }) {
  if (!env?.DB) {
    throw new Error("D1 database binding not available");
  }

  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({
    adapter,
  });
}
