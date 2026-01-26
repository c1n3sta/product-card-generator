import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

const mockUser = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createMockContext(): TrpcContext {
  return {
    user: mockUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Products Router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should parse CSV and create products", async () => {
    const caller = appRouter.createCaller(ctx);

    const csvContent = `SKU,Name,Description,Category,Price
PROD001,Test Widget,A test widget,Electronics,29.99
PROD002,Test Gadget,A test gadget,Electronics,39.99`;

    const result = await caller.products.uploadCSV({ csvContent });

    expect(result.success).toBe(true);
    expect(result.productCount).toBe(2);
    expect(result.products).toHaveLength(2);
    expect(result.products[0].sku).toBe("PROD001");
  });

  it("should throw error for invalid CSV", async () => {
    const caller = appRouter.createCaller(ctx);

    const csvContent = `Name,Description
Test Widget,A test widget`;

    await expect(caller.products.uploadCSV({ csvContent })).rejects.toThrow();
  });

  it("should validate accent color format", async () => {
    const caller = appRouter.createCaller(ctx);

    const csvContent = `SKU,Name
PROD001,Test Widget`;

    await caller.products.uploadCSV({ csvContent });
    const products = await caller.products.list();

    if (products.length > 0) {
      const result = await caller.products.createCard({
        productId: products[0].id,
        accentColor: "#0057B7",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid accent color", async () => {
    const caller = appRouter.createCaller(ctx);

    const csvContent = `SKU,Name
PROD001,Test Widget`;

    await caller.products.uploadCSV({ csvContent });
    const products = await caller.products.list();

    if (products.length > 0) {
      await expect(
        caller.products.createCard({
          productId: products[0].id,
          accentColor: "invalid-color",
        })
      ).rejects.toThrow();
    }
  });

  it("should list products for authenticated user", async () => {
    const caller = appRouter.createCaller(ctx);

    const csvContent = `SKU,Name
PROD001,Test Widget`;

    await caller.products.uploadCSV({ csvContent });
    const products = await caller.products.list();

    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });
});
