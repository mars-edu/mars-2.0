import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./controllers/authController.js";
import { getEnv } from "./utils/env.js";
import { getPrismaClient } from "./utils/prismaClient.js";
import type { D1Database } from "@cloudflare/workers-types";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  FRONTEND_URL: string;
};

const api = new Hono<{ Bindings: Env }>();

api.use("*", async (c, next) => {
  if (!c.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  // Test D1 connection
  try {
    const prisma = getPrismaClient(c.env);
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error);
  }

  await next();
});

api.use("*", logger());
api.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  })
);

api.get("/", (c) => {
  return c.text("Mars 2.0 API is running with Cloudflare Workers!");
});

api.get("/env", (c) => {
  return c.json({
    hasDb: !!c.env.DB,
    hasJwtSecret: !!c.env.JWT_SECRET,
    hasJwtExpiry: !!c.env.JWT_EXPIRY,
    hasFrontendUrl: !!c.env.FRONTEND_URL,
  });
});

api.route("/auth", auth);

const app = new Hono<{ Bindings: Env }>();
app.route("/api", api);

export default app;
