import { Context } from "hono";
import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import AuthService from "../services/authService.js";
import type { Env } from "../utils/env.js";

const auth = new Hono<{ Bindings: Env }>();

auth.post("/register", async (c: Context<{ Bindings: Env }>) => {
  try {
    const { firstName, lastName, middleName, iin, password, email } =
      await c.req.json();

    if (!firstName || !lastName || !password || !iin || !email) {
      return c.json(
        {
          success: false,
          message: "All required fields must be provided",
        },
        400
      );
    }

    const authService = new AuthService(c);
    const result = await authService.register({
      firstName,
      lastName,
      middleName,
      iin,
      password,
      email,
    });

    if (result.success && result.token) {
      setCookie(c, "auth_token", result.token, {
        path: "/",
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === "production",
      });
    }

    if (result.success) {
      return c.json(result);
    } else {
      return c.json(result, 400);
    }
  } catch (error) {
    console.error("Registration error:", error);
    return c.json(
      {
        success: false,
        message: "An error occurred while processing your request",
      },
      500
    );
  }
});

auth.post("/login", async (c: Context<{ Bindings: Env }>) => {
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

    const authService = new AuthService(c);
    const result = await authService.login({ username, password });

    if (result.success && result.token && remember) {
      setCookie(c, "auth_token", result.token, {
        path: "/",
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
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

auth.post("/validate-token", async (c: Context<{ Bindings: Env }>) => {
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

    const authService = new AuthService(c);
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
