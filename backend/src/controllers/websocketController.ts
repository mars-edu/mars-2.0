import { Hono } from "hono";
import AuthService from "../services/authService.js";
import type { Env } from "../types/env.js";

const wsApp = new Hono<{ Bindings: Env }>();

// @ts-ignore
wsApp.get("/", async (c) => {
  const authService = new AuthService(c);

  const token = c.req.query("token");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const validationResult = await authService.validateToken(token);
  if (!validationResult.success) {
    return new Response("Unauthorized", { status: 401 });
  }

  const id = c.env.WEBSOCKET_DO.idFromName("shared-state-room");
  const stub = c.env.WEBSOCKET_DO.get(id);

  const newRequest = new Request(c.req.raw.url, c.req.raw);
  newRequest.headers.set(
    "sec-websocket-extensions",
    "permessage-deflate; client_max_window_bits=15"
  );

  // @ts-ignore
  return stub.fetch(newRequest);
});

export default wsApp;
