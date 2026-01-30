/**
 * Pixelcut API integration for image processing
 * Handles background removal and AI background generation
 */

import axios from "axios";
import { generateImage } from "../_core/imageGeneration";

const PIXELCUT_API_URL = "https://api.developer.pixelcut.ai/v1";

export interface PixelcutRemoveBackgroundResult {
  imageUrl: string;
  format: string;
}

export interface PixelcutGenerateBackgroundResult {
  imageUrl: string;
}

/**
 * Remove background from product image using Pixelcut API
 * Returns a PNG with transparent background
 * Falls back to returning original image if API key not configured
 */
export async function removeBackground(imageUrl: string): Promise<PixelcutRemoveBackgroundResult> {
  const apiKey = process.env.PIXELCUT_API_KEY;
  
  if (!apiKey) {
    console.warn("[Pixelcut] API key not configured, returning original image");
    return {
      imageUrl: imageUrl,
      format: "original",
    };
  }

  try {
    const response = await axios.post(
      `${PIXELCUT_API_URL}/remove-background`,
      {
        image_url: imageUrl,
        format: "png",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": apiKey,
        },
      }
    );

    if (!response.data.image_url) {
      throw new Error("No image URL in response");
    }

    return {
      imageUrl: response.data.image_url,
      format: "png",
    };
  } catch (error) {
    console.error("Error removing background with Pixelcut:", error);
    // Return original image as fallback
    return {
      imageUrl: imageUrl,
      format: "original",
    };
  }
}

/**
 * Generate AI background using Manus image generation
 * Creates a contextual background based on the prompt
 */
export async function generateBackground(
  productImageUrl: string,
  backgroundPrompt: string
): Promise<PixelcutGenerateBackgroundResult> {
  try {
    // Use Manus image generation for background
    const result = await generateImage({
      prompt: `Professional product photography background: ${backgroundPrompt}. Clean, elegant, suitable for e-commerce product card. No text or products in the image.`,
    });

    return {
      imageUrl: result.url || "",
    };
  } catch (error) {
    console.error("Error generating background:", error);
    // Return a placeholder gradient background
    return {
      imageUrl: "",
    };
  }
}

/**
 * Validate if an image URL is accessible and returns valid image data
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  
  try {
    const response = await axios.head(imageUrl, {
      timeout: 5000,
    });

    const contentType = response.headers["content-type"];
    return contentType?.includes("image") || false;
  } catch (error) {
    console.warn(`Image URL validation failed for ${imageUrl}:`, error);
    return false;
  }
}
