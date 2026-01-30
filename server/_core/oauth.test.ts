import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { registerOAuthRoutes } from "./oauth";

describe("OAuth Routes", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let sendSpy: any;
  let cookieSpy: any;
  let redirectSpy: any;

  beforeEach(() => {
    sendSpy = vi.fn();
    cookieSpy = vi.fn();
    redirectSpy = vi.fn();

    mockReq = {
      query: {},
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: cookieSpy,
      redirect: redirectSpy,
      send: sendSpy,
    };
  });

  it("should return 400 if code is missing", async () => {
    const app = {
      get: vi.fn((path, handler) => {
        if (path === "/api/oauth/callback") {
          handler(mockReq, mockRes);
        }
      }),
    } as any;

    registerOAuthRoutes(app);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 if state is missing", async () => {
    mockReq.query = { code: "test-code" };

    const app = {
      get: vi.fn((path, handler) => {
        if (path === "/api/oauth/callback") {
          handler(mockReq, mockRes);
        }
      }),
    } as any;

    registerOAuthRoutes(app);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should register OAuth callback route", () => {
    const app = { get: vi.fn() } as any;
    registerOAuthRoutes(app);

    expect(app.get).toHaveBeenCalledWith("/api/oauth/callback", expect.any(Function));
  });
});
