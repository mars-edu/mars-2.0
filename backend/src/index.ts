import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./controllers/authController.js";
import ws from "./controllers/websocketController.js";
import files from "./controllers/fileController.js";
import teachers from "./controllers/teacherController.js";
import { getPrismaClient } from "./utils/prismaClient.js";
import type { Env } from "./types/env.js";

const api = new Hono<{ Bindings: Env }>();

api.use("*", async (c, next) => {
  if (!c.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  try {
    const prisma = getPrismaClient(c.env);
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
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.route("/api", api);

export default app;
export { WebSocketDurableObject } from "./durable-objects/WebSocketDurableObject.js";
