import { z } from "zod";
import { Secret } from "jsonwebtoken";
import type { D1Database } from "@cloudflare/workers-types";

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

// Cloudflare Workers env interface
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  FRONTEND_URL: string;
}

function validateEnv() {
  // Check if we're in a Cloudflare Worker context
  const isWorkerContext = typeof process === "undefined";

  if (isWorkerContext) {
    // Return a dummy env for Workers, as actual env will be injected later
    return {
      PORT: 3001,
      NODE_ENV: "development",
      DATABASE_URL: "cloudflare_d1",
      JWT_SECRET: "dummy_secret_for_workers" as Secret,
      JWT_EXPIRY: "24h",
      FRONTEND_URL: "http://localhost:5173",
    };
  }

  // For local development, fall back to process.env
  const env = process.env;

  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  return {
    ...parsed.data,
    JWT_SECRET: parsed.data.JWT_SECRET as Secret,
  };
}

// For Workers environment, use this function to get environment variables
export function getEnv(env: Env) {
  return {
    JWT_SECRET: env.JWT_SECRET as Secret,
    JWT_EXPIRY: env.JWT_EXPIRY,
    FRONTEND_URL: env.FRONTEND_URL,
    NODE_ENV: process?.env?.NODE_ENV || "development",
    DATABASE_URL: process?.env?.DATABASE_URL || "cloudflare_d1",
  };
}

// For Node.js environment
const env = validateEnv();

export default env;
