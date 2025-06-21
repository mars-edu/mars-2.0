import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import AuthService from "../services/authService.js";
import type { Env } from "../utils/env.js";

const wsApp = new Hono<{ Bindings: Env }>();

// @ts-ignore
wsApp.get("/", async (c) => {
  const authService = new AuthService(c);

  const cookieToken = getCookie(c, "auth_token");
  if (!cookieToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  const validationResult = await authService.validateToken(cookieToken);
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
