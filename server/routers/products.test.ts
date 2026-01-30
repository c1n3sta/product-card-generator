import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the database functions
vi.mock("../db", () => ({
  createProduct: vi.fn().mockResolvedValue({ id: 1, name: "Test Product", status: "pending" }),
  createProducts: vi.fn().mockImplementation((products) =>
    products.map((p: any, i: number) => ({ ...p, id: i + 1 }))
  ),
  getProductsByUserId: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Product 1", status: "pending" },
    { id: 2, userId: 1, name: "Product 2", status: "completed" },
  ]),
  getProductById: vi.fn().mockImplementation((id) =>
    Promise.resolve(id === 1 ? { id: 1, userId: 1, name: "Product 1", status: "pending" } : null)
  ),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Products Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("products.list", () => {
    it("should return products for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const products = await caller.products.list();

      expect(products).toHaveLength(2);
      expect(products[0].name).toBe("Product 1");
    });
  });

  describe("products.create", () => {
    it("should create a new product", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const product = await caller.products.create({
        name: "New Product",
        description: "A test product",
        category: "Electronics",
        price: "99.99",
      });

      expect(product).toBeDefined();
      expect(product.name).toBe("Test Product");
    });

    it("should require a name", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.products.create({
          name: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("products.importCSV", () => {
    it("should import products from valid CSV", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.products.importCSV({
        csvContent: `name,price
Product A,10.00
Product B,20.00`,
      });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
    });

    it("should fail for invalid CSV", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.products.importCSV({
        csvContent: `sku,price
SKU001,10.00`,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("products.getCSVTemplate", () => {
    it("should return a CSV template", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const template = await caller.products.getCSVTemplate();

      expect(template).toContain("sku");
      expect(template).toContain("name");
      expect(template).toContain("description");
    });
  });
});
