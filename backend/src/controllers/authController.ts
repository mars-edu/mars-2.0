import { Context } from "hono";
import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import authService from "../services/authService.js";

const auth = new Hono();

auth.post("/login", async (c: Context) => {
  try {
    const { username, password, remember } = await c.req.json();

    if (!username || !password) {
      return c.json(
        {
          success: false,
          message: "Username and password are required",
        },
        400
      );
    }

    const result = await authService.login({ username, password });

    if (result.success && result.token && remember) {
      setCookie(c, "auth_token", result.token, {
        path: "/",
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
      });
    }

    if (result.success) {
      return c.json(result);
    } else {
      return c.json(result, 401);
    }
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "An error occurred while processing your request",
      },
      500
    );
  }
});

auth.post("/validate-token", async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));

    const cookieToken = getCookie(c, "auth_token");
    const token = body.token || cookieToken;

    if (!token) {
      return c.json(
        {
          success: false,
          message: "Token is required",
        },
        400
      );
    }

    const result = await authService.validateToken(token);
    return c.json(result);
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "An error occurred while validating the token",
      },
      500
    );
  }
});

auth.post("/logout", async (c: Context) => {
  try {
    deleteCookie(c, "auth_token");
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "An error occurred while processing your request",
      },
      500
    );
  }
});

export default auth;
