import {
  createProcessingJob,
  createProcessingLog,
  updateProcessingJob,
  updateProcessingLog,
  getProductById,
  createProductCard,
  createCardLayer,
} from "../db";
import { extractProductData, discoverProductImages } from "./geminiService";
import { removeBackground, generateBackground, validateImageUrl } from "./pixelcutService";
import { notifyOwner } from "../_core/notification";

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
    startedAt: new Date(),
  });

  await notifyOwner({
    title: "Bulk Processing Started",
    content: `Processing ${productIds.length} products for card generation.`,
  });

  let processedCount = 0;
  let failedCount = 0;

  for (const productId of productIds) {
    try {
      await processProduct(job.id, userId, productId, accentColor, targetMarketplace);
      processedCount++;
    } catch (error) {
      console.error(`Failed to process product ${productId}:`, error);
      failedCount++;
      await notifyOwner({
        title: "Product Processing Failed",
        content: `Failed to process product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    await updateProcessingJob(job.id, {
      processedProducts: processedCount,
      failedProducts: failedCount,
    });
  }

  const finalStatus = failedCount === 0 ? "completed" : failedCount === productIds.length ? "failed" : "completed";
  await updateProcessingJob(job.id, {
    status: finalStatus,
    completedAt: new Date(),
  });

  await notifyOwner({
    title: "Bulk Processing Completed",
    content: `Processed ${processedCount} products successfully, ${failedCount} failed.`,
  });

  return job;
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

    const imageDiscoveryLog = await createProcessingLog({
      jobId,
      productId,
      step: "image_discovery",
      status: "processing",
      message: "Discovering product images...",
    });

    const discovery = await discoverProductImages(product.name, extraction.suggestedImageKeywords);
    let selectedImageUrl = discovery.selectedUrl;

    if (selectedImageUrl && !(await validateImageUrl(selectedImageUrl))) {
      const validUrls = [];
      for (const url of discovery.imageUrls) {
        if (await validateImageUrl(url)) {
          validUrls.push(url);
        }
      }
      selectedImageUrl = validUrls[0] || "";
    }

    await updateProcessingLog(imageDiscoveryLog.id, {
      status: "completed",
      message: `Found image: ${selectedImageUrl}`,
    });

    let backgroundImageUrl = "";
    let productImageWithoutBg = selectedImageUrl;
    
    if (selectedImageUrl) {
      const bgRemovalLog = await createProcessingLog({
        jobId,
        productId,
        step: "background_removal",
        status: "processing",
        message: "Removing product background...",
      });

      const removed = await removeBackground(selectedImageUrl);
      productImageWithoutBg = removed.imageUrl; // Use the background-removed image
      
      await updateProcessingLog(bgRemovalLog.id, {
        status: "completed",
        message: "Background removed successfully",
      });

      const bgGenerationLog = await createProcessingLog({
        jobId,
        productId,
        step: "background_generation",
        status: "processing",
        message: "Generating contextual background...",
      });

      const generated = await generateBackground(removed.imageUrl, extraction.backgroundPrompt);
      backgroundImageUrl = generated.imageUrl;

      await updateProcessingLog(bgGenerationLog.id, {
        status: "completed",
        message: "Background generated successfully",
      });
    }

    const cardAssemblyLog = await createProcessingLog({
      jobId,
      productId,
      step: "card_assembly",
      status: "processing",
      message: "Assembling product card...",
    });

    const card = await createProductCard({
      productId,
      userId,
      accentColor,
      marketingCopy: extraction.marketingCopy,
      backgroundPrompt: extraction.backgroundPrompt,
      status: "completed",
      processingJobId: jobId,
    });

    if (productImageWithoutBg) {
      await createCardLayer({
        cardId: card.id,
        layerType: "product_image",
        imageUrl: productImageWithoutBg,
        status: "completed",
      });
    }

    if (backgroundImageUrl) {
      await createCardLayer({
        cardId: card.id,
        layerType: "background",
        imageUrl: backgroundImageUrl,
        status: "completed",
      });
    }

    await createCardLayer({
      cardId: card.id,
      layerType: "text_title",
      textContent: extraction.title,
      status: "completed",
    });

    await createCardLayer({
      cardId: card.id,
      layerType: "text_description",
      textContent: extraction.marketingCopy,
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
    throw error;
  }
}
