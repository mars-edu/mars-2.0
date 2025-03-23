import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getCookie } from "hono/cookie";
import authController from "./controllers/authController.js";
import env from "./utils/env.js";

type AppVariables = {
  token?: string;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("*", async (c, next) => {
  const token = getCookie(c, "auth_token");
  if (token) {
    c.set("token", token);
  }
  await next();
});

app.route("/api/auth", authController);

app.get("/", (c) => {
  return c.text("Mars 2.0 API");
});

const port = env.PORT || 3001;
console.log(`Server running on port ${port}`);

export default app;
