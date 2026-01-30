/**
 * Gemini API integration for intelligent product data processing
 * Uses Manus Forge API for reliable, rate-limited access
 */

import { invokeLLM } from "../_core/llm";

export interface GeminiExtractionResult {
  title: string;
  marketingCopy: string;
  backgroundPrompt: string;
  suggestedImageKeywords: string[];
}

export interface GeminiImageSearchResult {
  imageUrls: string[];
  selectedUrl: string;
}

/**
 * Extract and enhance product data using Gemini
 * Generates marketing copy and background scene descriptions
 */
export async function extractProductData(
  productName: string,
  productDescription: string | undefined,
  category: string | undefined,
  targetMarketplace: string = "general"
): Promise<GeminiExtractionResult> {
  const prompt = `You are an expert e-commerce product marketing specialist.

Analyze the following product and generate:
1. An optimized product title (max 60 chars)
2. Compelling marketing copy (2-3 sentences, highlighting key benefits)
3. A detailed background scene description for a professional product card (for AI image generation)
4. 3-5 image search keywords

Product Information:
- Name: ${productName}
- Description: ${productDescription || "Not provided"}
- Category: ${category || "General"}
- Target Marketplace: ${targetMarketplace}

Respond in JSON format with keys: title, marketingCopy, backgroundPrompt, suggestedImageKeywords (array)`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Optimized product title" },
              marketingCopy: { type: "string", description: "Marketing copy for the product" },
              backgroundPrompt: { type: "string", description: "Background scene description" },
              suggestedImageKeywords: {
                type: "array",
                items: { type: "string" },
                description: "Keywords for image search",
              },
            },
            required: ["title", "marketingCopy", "backgroundPrompt", "suggestedImageKeywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from Gemini");
    }

    let contentStr = typeof content === "string" ? content : "";
    if (Array.isArray(content)) {
      const textContent = content.find((c) => typeof c === "object" && "text" in c);
      contentStr = textContent && "text" in textContent ? textContent.text : "";
    }

    const parsed = JSON.parse(contentStr);
    return {
      title: parsed.title || productName,
      marketingCopy: parsed.marketingCopy || "",
      backgroundPrompt: parsed.backgroundPrompt || "",
      suggestedImageKeywords: parsed.suggestedImageKeywords || [],
    };
  } catch (error) {
    console.error("Error extracting product data from Gemini:", error);
    throw new Error(`Failed to extract product data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate image search keywords and discover product image URLs
 * Uses Gemini to suggest high-quality image sources
 */
export async function discoverProductImages(
  productName: string,
  suggestedKeywords: string[]
): Promise<GeminiImageSearchResult> {
  const keywords = suggestedKeywords.slice(0, 3).join(", ");

  const prompt = `You are an expert in finding high-quality product images for e-commerce.

For the product "${productName}" with keywords: ${keywords}

Suggest 3-5 high-quality, royalty-free product image URLs from common sources like:
- Unsplash (unsplash.com)
- Pexels (pexels.com)
- Pixabay (pixabay.com)
- Or direct product images from reputable sources

Respond with a JSON object containing:
- imageUrls: array of 3-5 valid image URLs
- selectedUrl: the best URL from the list (for primary use)

Make sure the URLs are direct image links that work.
Respond ONLY with valid JSON, no markdown formatting.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON with valid image URLs.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from Gemini");
    }

    let contentStr = typeof content === "string" ? content : "";
    if (Array.isArray(content)) {
      const textContent = content.find((c) => typeof c === "object" && "text" in c);
      contentStr = textContent && "text" in textContent ? textContent.text : "";
    }

    let parsed;
    try {
      parsed = JSON.parse(contentStr);
    } catch {
      const jsonMatch = contentStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Could not parse JSON from response");
      }
    }

    return {
      imageUrls: parsed.imageUrls || [],
      selectedUrl: parsed.selectedUrl || (parsed.imageUrls?.[0] || ""),
    };
  } catch (error) {
    console.error("Error discovering product images from Gemini:", error);
    // Return empty result instead of throwing to allow workflow to continue
    return {
      imageUrls: [],
      selectedUrl: "",
    };
  }
}
