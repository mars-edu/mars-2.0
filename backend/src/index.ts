import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./controllers/authController.js";
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

api.get("/", (c) => {
  return c.text("Mars 2.0 API is running with Cloudflare Workers!");
});

api.get("/env", (c) => {
  return c.json({
    db: c.env.DB,
    jwtSecret: c.env.JWT_SECRET,
    jwtExpiry: c.env.JWT_EXPIRY,
    frontendUrl: c.env.FRONTEND_URL,
  });
});

api.route("/auth", auth);

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "https://mars-2-0.pages.dev",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.route("/api", api);

export default app;
