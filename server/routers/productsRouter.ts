import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createProduct,
  createProducts,
  getProductsByUserId,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../db";
import { parseCSV, generateCSVTemplate } from "../utils/csvParser";

export const productsRouter = router({
  // List all products for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return getProductsByUserId(ctx.user.id);
  }),

  // Get a single product by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const product = await getProductById(input.id);
      if (!product || product.userId !== ctx.user.id) {
        throw new Error("Product not found");
      }
      return product;
    }),

  // Create a single product
  create: protectedProcedure
    .input(
      z.object({
        sku: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        price: z.string().optional(),
        originalImageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createProduct({
        userId: ctx.user.id,
        sku: input.sku || null,
        name: input.name,
        description: input.description || null,
        category: input.category || null,
        price: input.price || null,
        originalImageUrl: input.originalImageUrl || null,
        status: "pending",
      });
    }),

  // Update a product
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        sku: z.string().optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        price: z.string().optional(),
        originalImageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const product = await getProductById(input.id);
      if (!product || product.userId !== ctx.user.id) {
        throw new Error("Product not found");
      }

      const { id, ...updates } = input;
      await updateProduct(id, updates);
      return getProductById(id);
    }),

  // Delete a product
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const product = await getProductById(input.id);
      if (!product || product.userId !== ctx.user.id) {
        throw new Error("Product not found");
      }

      await deleteProduct(input.id);
      return { success: true };
    }),

  // Import products from CSV
  importCSV: protectedProcedure
    .input(z.object({ csvContent: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const parseResult = parseCSV(input.csvContent);

      if (!parseResult.success) {
        return {
          success: false,
          imported: 0,
          errors: parseResult.errors,
          totalRows: parseResult.totalRows,
        };
      }

      // Create products from parsed data
      const productsToCreate = parseResult.products.map((p) => ({
        userId: ctx.user.id,
        sku: p.sku || null,
        name: p.name,
        description: p.description || null,
        category: p.category || null,
        price: p.price || null,
        originalImageUrl: p.imageUrl || null,
        status: "pending" as const,
      }));

      const created = await createProducts(productsToCreate);

      return {
        success: true,
        imported: created.length,
        errors: parseResult.errors,
        totalRows: parseResult.totalRows,
      };
    }),

  // Get CSV template
  getCSVTemplate: protectedProcedure.query(() => {
    return generateCSVTemplate();
  }),

  // Bulk delete products
  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      let deleted = 0;
      for (const id of input.ids) {
        const product = await getProductById(id);
        if (product && product.userId === ctx.user.id) {
          await deleteProduct(id);
          deleted++;
        }
      }
      return { deleted };
    }),
});
