/**
 * Bulk Processing Service
 * Handles the complete workflow from product data to finished card
 */

import {
  createProcessingJob,
  createProcessingLog,
  updateProcessingJob,
  updateProcessingLog,
  getProductById,
  createProductCard,
  createCardLayer,
  updateProduct,
} from "../db";
import { extractProductData, discoverProductImages } from "./geminiService";
import { removeBackground, generateBackground, validateImageUrl } from "./pixelcutService";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export interface BulkProcessingOptions {
  userId: number;
  productIds: number[];
  accentColor: string;
  targetMarketplace?: string;
}

export async function startBulkProcessing(options: BulkProcessingOptions) {
  const { userId, productIds, accentColor, targetMarketplace } = options;

  const job = await createProcessingJob({
    userId,
    jobName: `Bulk Card Generation - ${new Date().toLocaleString()}`,
    totalProducts: productIds.length,
    status: "running",
    accentColor,
    targetMarketplace,
    startedAt: new Date(),
  });

  // Notify owner that processing has started
  await notifyOwner({
    title: "Bulk Processing Started",
    content: `Processing ${productIds.length} products for card generation. Job ID: ${job.id}`,
  }).catch((err) => console.warn("[Notification] Failed to notify:", err));

  // Process products asynchronously
  processProductsAsync(job.id, userId, productIds, accentColor, targetMarketplace);

  return job;
}

async function processProductsAsync(
  jobId: number,
  userId: number,
  productIds: number[],
  accentColor: string,
  targetMarketplace?: string
) {
  let processedCount = 0;
  let failedCount = 0;

  for (const productId of productIds) {
    try {
      await processProduct(jobId, userId, productId, accentColor, targetMarketplace);
      processedCount++;
    } catch (error) {
      console.error(`Failed to process product ${productId}:`, error);
      failedCount++;
      await notifyOwner({
        title: "Product Processing Failed",
        content: `Failed to process product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      }).catch((err) => console.warn("[Notification] Failed to notify:", err));
    }

    await updateProcessingJob(jobId, {
      processedProducts: processedCount,
      failedProducts: failedCount,
    });
  }

  const finalStatus = failedCount === 0 ? "completed" : failedCount === productIds.length ? "failed" : "completed";
  await updateProcessingJob(jobId, {
    status: finalStatus,
    completedAt: new Date(),
  });

  await notifyOwner({
    title: "Bulk Processing Completed",
    content: `Processed ${processedCount} products successfully, ${failedCount} failed. Job ID: ${jobId}`,
  }).catch((err) => console.warn("[Notification] Failed to notify:", err));
}

async function processProduct(
  jobId: number,
  userId: number,
  productId: number,
  accentColor: string,
  targetMarketplace?: string
) {
  const product = await getProductById(productId);
  if (!product || product.userId !== userId) {
    throw new Error("Product not found or access denied");
  }

  let logId: number | null = null;

  try {
    // Step 1: Data Extraction
    const dataExtractionLog = await createProcessingLog({
      jobId,
      productId,
      step: "data_extraction",
      status: "processing",
      message: "Extracting product data with Gemini...",
    });
    logId = dataExtractionLog.id;

    const extraction = await extractProductData(
      product.name,
      product.description || undefined,
      product.category || undefined,
      targetMarketplace || "general"
    );

    await updateProcessingLog(dataExtractionLog.id, {
      status: "completed",
      message: `Extracted title: ${extraction.title}`,
    });

    // Step 2: Image Discovery
    const imageDiscoveryLog = await createProcessingLog({
      jobId,
      productId,
      step: "image_discovery",
      status: "processing",
      message: "Discovering product images...",
    });

    let selectedImageUrl = product.originalImageUrl || "";
    
    if (!selectedImageUrl) {
      const discovery = await discoverProductImages(product.name, extraction.suggestedImageKeywords);
      selectedImageUrl = discovery.selectedUrl;

      if (selectedImageUrl && !(await validateImageUrl(selectedImageUrl))) {
        const validUrls = [];
        for (const url of discovery.imageUrls) {
          if (await validateImageUrl(url)) {
            validUrls.push(url);
          }
        }
        selectedImageUrl = validUrls[0] || "";
      }
    }

    await updateProcessingLog(imageDiscoveryLog.id, {
      status: "completed",
      message: selectedImageUrl ? `Found image: ${selectedImageUrl}` : "No image found",
    });

    // Step 3: Background Removal
    let processedImageUrl = selectedImageUrl;
    if (selectedImageUrl) {
      const bgRemovalLog = await createProcessingLog({
        jobId,
        productId,
        step: "background_removal",
        status: "processing",
        message: "Removing product background...",
      });

      try {
        const removed = await removeBackground(selectedImageUrl);
        processedImageUrl = removed.imageUrl;
        
        await updateProcessingLog(bgRemovalLog.id, {
          status: "completed",
          message: "Background removed successfully",
        });
      } catch (error) {
        await updateProcessingLog(bgRemovalLog.id, {
          status: "completed",
          message: "Background removal skipped (using original)",
        });
      }
    }

    // Step 4: Background Generation
    let backgroundImageUrl = "";
    const bgGenerationLog = await createProcessingLog({
      jobId,
      productId,
      step: "background_generation",
      status: "processing",
      message: "Generating contextual background...",
    });

    try {
      const generated = await generateBackground(processedImageUrl, extraction.backgroundPrompt);
      backgroundImageUrl = generated.imageUrl;

      await updateProcessingLog(bgGenerationLog.id, {
        status: "completed",
        message: backgroundImageUrl ? "Background generated successfully" : "Using default background",
      });
    } catch (error) {
      await updateProcessingLog(bgGenerationLog.id, {
        status: "completed",
        message: "Background generation skipped",
      });
    }

    // Step 5: Card Assembly
    const cardAssemblyLog = await createProcessingLog({
      jobId,
      productId,
      step: "card_assembly",
      status: "processing",
      message: "Assembling product card...",
    });

    // Update product with processed image
    await updateProduct(productId, {
      processedImageUrl: processedImageUrl,
      status: "completed",
    });

    // Create the product card
    const card = await createProductCard({
      productId,
      userId,
      accentColor,
      marketingCopy: extraction.marketingCopy,
      backgroundPrompt: extraction.backgroundPrompt,
      status: "completed",
      processingJobId: jobId,
    });

    // Create layers
    let layerOrder = 0;

    // Background layer
    if (backgroundImageUrl) {
      await createCardLayer({
        cardId: card.id,
        layerType: "background",
        layerOrder: layerOrder++,
        imageUrl: backgroundImageUrl,
        status: "completed",
      });
    }

    // Product image layer
    if (processedImageUrl) {
      await createCardLayer({
        cardId: card.id,
        layerType: "product_image",
        layerOrder: layerOrder++,
        imageUrl: processedImageUrl,
        status: "completed",
      });
    }

    // Title layer
    await createCardLayer({
      cardId: card.id,
      layerType: "text_title",
      layerOrder: layerOrder++,
      textContent: extraction.title,
      fontFamily: "Inter",
      fontSize: 32,
      fontColor: "#FFFFFF",
      fontWeight: "bold",
      textAlign: "center",
      status: "completed",
    });

    // Description layer
    await createCardLayer({
      cardId: card.id,
      layerType: "text_description",
      layerOrder: layerOrder++,
      textContent: extraction.marketingCopy,
      fontFamily: "Inter",
      fontSize: 16,
      fontColor: "#FFFFFF",
      fontWeight: "normal",
      textAlign: "center",
      status: "completed",
    });

    await updateProcessingLog(cardAssemblyLog.id, {
      status: "completed",
      message: "Card assembled successfully",
    });
  } catch (error) {
    if (logId) {
      await updateProcessingLog(logId, {
        status: "failed",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      });
    }
    
    await updateProduct(productId, {
      status: "failed",
    });
    
    throw error;
  }
}
