import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Send HTML with JavaScript redirect to ensure cookie is set before navigation
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            // Wait a tick to ensure cookie is set, then redirect
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Error</title>
        </head>
        <body>
          <h1>Authentication Error</h1>
          <p>Failed to authenticate. Please try again.</p>
          <a href="/">Back to Home</a>
          <script>
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          </script>
        </body>
        </html>
      `);
    }
  });
}
