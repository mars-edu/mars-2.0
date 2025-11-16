import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trpcServer } from "@hono/trpc-server";
import auth from "./controllers/authController.js";
import ws from "./controllers/websocketController.js";
import files from "./controllers/fileController.js";
import teachers from "./controllers/teacherController.js";
import { appRouter } from "./trpc/routers/index.js";
import { createContext } from "./trpc/trpc.js";
import { getPrismaClient } from "./utils/prismaClient.js";
import { runMigrations } from "./utils/migrations.js";
import { i18nMiddleware } from "./middleware/i18n.js";
import type { Env } from "./types/env.js";

const api = new Hono<{ Bindings: Env }>();

// Run migrations once on first request
let migrationsRun = false;

api.use("*", async (c, next) => {
  if (!c.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  // Run migrations on first request
  if (!migrationsRun) {
    try {
      await runMigrations(c.env.DB);
      migrationsRun = true;
    } catch (error) {
      console.error("Migration error:", error);
      // Continue even if migrations fail (tables might already exist)
    }
  }

  try {
    const prisma = getPrismaClient(c.env);
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error);
  }

  await next();
});

api.use("*", i18nMiddleware);
api.use("*", logger());

api.get("/", (c) => {
  return c.text("Mars 2.0 API is running with Cloudflare Workers!");
});

api.route("/auth", auth);
api.route("/ws", ws);
api.route("/files", files);
api.route("/teachers", teachers);

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowedOrigins = [
        c.env.FRONTEND_URL,
        c.env.FRONTEND_URL_DEV,
        "http://localhost:5173",
      ];
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Language"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.route("/api", api);

// Add tRPC endpoint at the app level after /api is set
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    endpoint: "/api/trpc",
  })
);

export default app;
export { WebSocketDurableObject } from "./durable-objects/WebSocketDurableObject.js";
