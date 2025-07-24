import { Secret } from "jsonwebtoken";
import type { D1Database } from "@cloudflare/workers-types";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  WEBSOCKET_DO: DurableObjectNamespace;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  FRONTEND_URL: string;
  FRONTEND_URL_DEV: string;
  R2_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}

export interface ProcessEnv {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL?: string;
  JWT_SECRET: Secret;
  JWT_EXPIRY: string;
  FRONTEND_URL: string;
}
