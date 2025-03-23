import { z } from "zod";
import { Secret } from "jsonwebtoken";

const envSchema = z.object({
  PORT: z.string().default("3001").transform(Number),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string(),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().default("24h"),

  FRONTEND_URL: z.string().url().optional().default("http://localhost:5173"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

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

const env = validateEnv();

export default env;
