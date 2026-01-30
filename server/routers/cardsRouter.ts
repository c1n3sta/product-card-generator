import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getCardsByUserId,
  getCardById,
  getCardByProductId,
  createProductCard,
  updateProductCard,
  deleteProductCard,
  getLayersByCardId,
  createCardLayer,
  updateCardLayer,
  deleteCardLayer,
  getProductById,
} from "../db";

export const cardsRouter = router({
  // List all cards for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCardsByUserId(ctx.user.id);
  }),

  // Get a single card with its layers
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const card = await getCardById(input.id);
      if (!card || card.userId !== ctx.user.id) {
        throw new Error("Card not found");
      }

      const layers = await getLayersByCardId(card.id);
      const product = await getProductById(card.productId);

      return {
        ...card,
        layers,
        product,
      };
    }),

  // Get card by product ID
  getByProductId: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input, ctx }) => {
      const card = await getCardByProductId(input.productId);
      if (!card || card.userId !== ctx.user.id) {
        return null;
      }

      const layers = await getLayersByCardId(card.id);
      return {
        ...card,
        layers,
      };
    }),

  // Create a new card
  create: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        accentColor: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const product = await getProductById(input.productId);
      if (!product || product.userId !== ctx.user.id) {
        throw new Error("Product not found");
      }

      return createProductCard({
        productId: input.productId,
        userId: ctx.user.id,
        accentColor: input.accentColor || "#3B82F6",
        status: "draft",
      });
    }),

  // Update card properties
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        accentColor: z.string().optional(),
        marketingCopy: z.string().optional(),
        backgroundPrompt: z.string().optional(),
        canvasData: z.any().optional(),
        finalImageUrl: z.string().optional(),
        status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const card = await getCardById(input.id);
      if (!card || card.userId !== ctx.user.id) {
        throw new Error("Card not found");
      }

      const { id, ...updates } = input;
      await updateProductCard(id, updates);
      return getCardById(id);
    }),

  // Delete a card
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const card = await getCardById(input.id);
      if (!card || card.userId !== ctx.user.id) {
        throw new Error("Card not found");
      }

      await deleteProductCard(input.id);
      return { success: true };
    }),

  // Layer operations
  layers: router({
    // Get layers for a card
    list: protectedProcedure
      .input(z.object({ cardId: z.number() }))
      .query(async ({ input, ctx }) => {
        const card = await getCardById(input.cardId);
        if (!card || card.userId !== ctx.user.id) {
          throw new Error("Card not found");
        }

        return getLayersByCardId(input.cardId);
      }),

    // Create a new layer
    create: protectedProcedure
      .input(
        z.object({
          cardId: z.number(),
          layerType: z.enum(["background", "product_image", "text_title", "text_description", "custom"]),
          layerOrder: z.number().optional(),
          imageUrl: z.string().optional(),
          textContent: z.string().optional(),
          positionX: z.number().optional(),
          positionY: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          rotation: z.number().optional(),
          opacity: z.string().optional(),
          fontFamily: z.string().optional(),
          fontSize: z.number().optional(),
          fontColor: z.string().optional(),
          fontWeight: z.string().optional(),
          textAlign: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const card = await getCardById(input.cardId);
        if (!card || card.userId !== ctx.user.id) {
          throw new Error("Card not found");
        }

        return createCardLayer({
          ...input,
          status: "completed",
        });
      }),

    // Update a layer
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          cardId: z.number(),
          layerOrder: z.number().optional(),
          imageUrl: z.string().optional(),
          textContent: z.string().optional(),
          positionX: z.number().optional(),
          positionY: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          rotation: z.number().optional(),
          opacity: z.string().optional(),
          fontFamily: z.string().optional(),
          fontSize: z.number().optional(),
          fontColor: z.string().optional(),
          fontWeight: z.string().optional(),
          textAlign: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const card = await getCardById(input.cardId);
        if (!card || card.userId !== ctx.user.id) {
          throw new Error("Card not found");
        }

        const { id, cardId, ...updates } = input;
        await updateCardLayer(id, updates);
        return { success: true };
      }),

    // Delete a layer
    delete: protectedProcedure
      .input(z.object({ id: z.number(), cardId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const card = await getCardById(input.cardId);
        if (!card || card.userId !== ctx.user.id) {
          throw new Error("Card not found");
        }

        await deleteCardLayer(input.id);
        return { success: true };
      }),
  }),
});
