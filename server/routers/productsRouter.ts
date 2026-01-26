import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createProduct,
  getProductsByUserId,
  getProductById,
  createProductCard,
  getCardsByUserId,
  getCardByProductId,
  updateProductCard,
  getLayersByCardId,
} from "../db";
import { parseCSV } from "../utils/csvParser";
import { extractProductData, discoverProductImages } from "../services/geminiService";
import { validateImageUrl } from "../services/pixelcutService";

export const productsRouter = router({
  uploadCSV: protectedProcedure
    .input(z.object({ csvContent: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const parsedProducts = parseCSV(input.csvContent);
      const createdProducts = [];
      for (const product of parsedProducts) {
        const created = await createProduct({
          userId: ctx.user.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          rawData: JSON.stringify(product.rawData),
        });
        createdProducts.push(created);
      }
      return { success: true, productCount: createdProducts.length, products: createdProducts };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getProductsByUserId(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const product = await getProductById(input.id);
      if (!product || product.userId !== ctx.user.id) throw new Error("Not found");
      return product;
    }),

  extractData: protectedProcedure
    .input(z.object({ productId: z.number(), targetMarketplace: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const product = await getProductById(input.productId);
      if (!product || product.userId !== ctx.user.id) throw new Error("Not found");
      const extraction = await extractProductData(
        product.name,
        product.description || undefined,
        product.category || undefined,
        input.targetMarketplace || "general"
      );
      return { success: true, data: extraction };
    }),

  discoverImages: protectedProcedure
    .input(z.object({ productId: z.number(), keywords: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const product = await getProductById(input.productId);
      if (!product || product.userId !== ctx.user.id) throw new Error("Not found");
      const discovery = await discoverProductImages(product.name, input.keywords);
      const validatedUrls = [];
      for (const url of discovery.imageUrls) {
        const isValid = await validateImageUrl(url);
        if (isValid) validatedUrls.push(url);
      }
      return {
        success: true,
        imageUrls: validatedUrls,
        selectedUrl: validatedUrls[0] || discovery.selectedUrl,
      };
    }),

  createCard: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i),
        marketingCopy: z.string().optional(),
        backgroundPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const product = await getProductById(input.productId);
      if (!product || product.userId !== ctx.user.id) throw new Error("Not found");
      const card = await createProductCard({
        productId: input.productId,
        userId: ctx.user.id,
        accentColor: input.accentColor,
        marketingCopy: input.marketingCopy,
        backgroundPrompt: input.backgroundPrompt,
        status: "draft",
      });
      return { success: true, card };
    }),

  listCards: protectedProcedure.query(async ({ ctx }) => {
    return getCardsByUserId(ctx.user.id);
  }),

  getCard: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input, ctx }) => {
      const card = await getCardByProductId(input.productId);
      if (!card || card.userId !== ctx.user.id) throw new Error("Not found");
      return card;
    }),

  getCardLayers: protectedProcedure
    .input(z.object({ cardId: z.number() }))
    .query(async ({ input, ctx }) => {
      const card = await getCardByProductId(input.cardId);
      if (!card || card.userId !== ctx.user.id) throw new Error("Not found");
      return getLayersByCardId(input.cardId);
    }),

  updateCard: protectedProcedure
    .input(
      z.object({
        cardId: z.number(),
        accentColor: z.string().optional(),
        marketingCopy: z.string().optional(),
        backgroundPrompt: z.string().optional(),
        fabricJson: z.string().optional(),
        status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const card = await getCardByProductId(input.cardId);
      if (!card || card.userId !== ctx.user.id) throw new Error("Not found");
      const updates: Record<string, unknown> = {};
      if (input.accentColor) updates.accentColor = input.accentColor;
      if (input.marketingCopy) updates.marketingCopy = input.marketingCopy;
      if (input.backgroundPrompt) updates.backgroundPrompt = input.backgroundPrompt;
      if (input.fabricJson) updates.fabricJson = input.fabricJson;
      if (input.status) updates.status = input.status;
      await updateProductCard(input.cardId, updates);
      return { success: true };
    }),
});
