/**
 * Pixelcut API integration for image processing
 */

import axios from "axios";

const PIXELCUT_API_URL = "https://api.developer.pixelcut.ai/v1";
const PIXELCUT_API_KEY = process.env.PIXELCUT_API_KEY || "";

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
 */
export async function removeBackground(imageUrl: string): Promise<PixelcutRemoveBackgroundResult> {
  if (!PIXELCUT_API_KEY) {
    throw new Error("PIXELCUT_API_KEY is not configured");
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
          "X-API-KEY": PIXELCUT_API_KEY,
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
    throw new Error(
      `Failed to remove background: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate AI background using Pixelcut API
 * Takes a transparent product image and generates a contextual background
 */
export async function generateBackground(
  productImageUrl: string,
  backgroundPrompt: string
): Promise<PixelcutGenerateBackgroundResult> {
  if (!PIXELCUT_API_KEY) {
    throw new Error("PIXELCUT_API_KEY is not configured");
  }

  try {
    const response = await axios.post(
      `${PIXELCUT_API_URL}/generate-background`,
      {
        image_url: productImageUrl,
        prompt: backgroundPrompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": PIXELCUT_API_KEY,
        },
      }
    );

    if (!response.data.image_url) {
      throw new Error("No image URL in response");
    }

    return {
      imageUrl: response.data.image_url,
    };
  } catch (error) {
    console.error("Error generating background with Pixelcut:", error);
    throw new Error(
      `Failed to generate background: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate if an image URL is accessible and returns valid image data
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
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
