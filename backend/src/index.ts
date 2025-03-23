import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

type Env = {
  DB: any;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  FRONTEND_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.text("Mars 2.0 API is running with Cloudflare Workers!");
});

app.get("/env", (c) => {
  return c.json({
    hasDb: !!c.env.DB,
    hasJwtSecret: !!c.env.JWT_SECRET,
    hasJwtExpiry: !!c.env.JWT_EXPIRY,
    hasFrontendUrl: !!c.env.FRONTEND_URL,
  });
});

export default app;
