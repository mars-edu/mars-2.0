import { z } from "zod";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env, ProcessEnv } from "../types/env.js";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().optional(),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().default("24h"),

  FRONTEND_URL: z.string().url().optional().default("http://localhost:5173"),
});

export function getEnv(env: Env) {
  return {
    JWT_SECRET: env.JWT_SECRET,
    JWT_EXPIRY: env.JWT_EXPIRY,
    FRONTEND_URL: env.FRONTEND_URL,
    NODE_ENV: process?.env?.NODE_ENV || "development",
    DATABASE_URL: process?.env?.DATABASE_URL || "cloudflare_d1",
  };
}

function validateEnv(): ProcessEnv {
  const isWorkerContext =
    typeof process === "undefined" || process.env === undefined;

  if (isWorkerContext) {
    return {
      PORT: 3001,
      NODE_ENV: "development",
      DATABASE_URL: "cloudflare_d1",
      JWT_SECRET: process?.env?.JWT_SECRET || "dummy_secret_for_workers",
      JWT_EXPIRY: process?.env?.JWT_EXPIRY || "24h",
      FRONTEND_URL: process?.env?.FRONTEND_URL || "http://localhost:5173",
    };
  }

  // For local development, use process.env
  const env = process.env;

  const parsed = envSchema.safeParse({
    ...env,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  return {
    ...parsed.data,
    JWT_SECRET: parsed.data.JWT_SECRET,
  };
}

const env = validateEnv();
export default env;
