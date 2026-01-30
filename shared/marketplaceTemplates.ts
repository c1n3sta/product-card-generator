/**
 * Russian Marketplace Templates
 * Specifications for major Russian e-commerce platforms
 */

export interface MarketplaceTemplate {
  id: string;
  name: string;
  displayName: string;
  width: number;
  height: number;
  aspectRatio: string;
  minResolution: number;
  maxFileSize: number; // in MB
  format: string[];
  guidelines: {
    backgroundColor: string;
    textSafeZone: { top: number; right: number; bottom: number; left: number }; // in pixels
    productImageMaxSize: number; // percentage of canvas
    titleFontSize: { min: number; max: number };
    descriptionFontSize: { min: number; max: number };
    recommendedFonts: string[];
  };
  composition: {
    productPosition: { x: number; y: number }; // percentage from top-left
    productScale: number; // percentage of canvas
    titlePosition: { x: number; y: number };
    descriptionPosition: { x: number; y: number };
  };
}

export const MARKETPLACE_TEMPLATES: Record<string, MarketplaceTemplate> = {
  wildberries: {
    id: "wildberries",
    name: "wildberries",
    displayName: "Wildberries",
    width: 900,
    height: 1200,
    aspectRatio: "3:4",
    minResolution: 72,
    maxFileSize: 10,
    format: ["jpg", "jpeg", "png"],
    guidelines: {
      backgroundColor: "#FFFFFF",
      textSafeZone: { top: 50, right: 50, bottom: 50, left: 50 },
      productImageMaxSize: 70,
      titleFontSize: { min: 36, max: 48 },
      descriptionFontSize: { min: 24, max: 32 },
      recommendedFonts: ["Inter", "Roboto", "Open Sans"],
    },
    composition: {
      productPosition: { x: 50, y: 40 },
      productScale: 60,
      titlePosition: { x: 50, y: 10 },
      descriptionPosition: { x: 50, y: 85 },
    },
  },
  ozon: {
    id: "ozon",
    name: "ozon",
    displayName: "Ozon",
    width: 1024,
    height: 1024,
    aspectRatio: "1:1",
    minResolution: 72,
    maxFileSize: 10,
    format: ["jpg", "jpeg", "png"],
    guidelines: {
      backgroundColor: "#FFFFFF",
      textSafeZone: { top: 60, right: 60, bottom: 60, left: 60 },
      productImageMaxSize: 65,
      titleFontSize: { min: 32, max: 42 },
      descriptionFontSize: { min: 22, max: 28 },
      recommendedFonts: ["Inter", "Roboto", "Montserrat"],
    },
    composition: {
      productPosition: { x: 50, y: 45 },
      productScale: 55,
      titlePosition: { x: 50, y: 12 },
      descriptionPosition: { x: 50, y: 82 },
    },
  },
  yandex_market: {
    id: "yandex_market",
    name: "yandex_market",
    displayName: "Яндекс Маркет",
    width: 1200,
    height: 900,
    aspectRatio: "4:3",
    minResolution: 72,
    maxFileSize: 10,
    format: ["jpg", "jpeg", "png"],
    guidelines: {
      backgroundColor: "#FFFFFF",
      textSafeZone: { top: 40, right: 80, bottom: 40, left: 80 },
      productImageMaxSize: 60,
      titleFontSize: { min: 38, max: 50 },
      descriptionFontSize: { min: 26, max: 34 },
      recommendedFonts: ["Inter", "Roboto", "PT Sans"],
    },
    composition: {
      productPosition: { x: 35, y: 50 },
      productScale: 50,
      titlePosition: { x: 70, y: 25 },
      descriptionPosition: { x: 70, y: 60 },
    },
  },
  avito: {
    id: "avito",
    name: "avito",
    displayName: "Avito",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    minResolution: 72,
    maxFileSize: 10,
    format: ["jpg", "jpeg", "png"],
    guidelines: {
      backgroundColor: "#FFFFFF",
      textSafeZone: { top: 50, right: 50, bottom: 50, left: 50 },
      productImageMaxSize: 70,
      titleFontSize: { min: 34, max: 44 },
      descriptionFontSize: { min: 24, max: 30 },
      recommendedFonts: ["Inter", "Roboto", "Open Sans"],
    },
    composition: {
      productPosition: { x: 50, y: 50 },
      productScale: 60,
      titlePosition: { x: 50, y: 10 },
      descriptionPosition: { x: 50, y: 85 },
    },
  },
  custom: {
    id: "custom",
    name: "custom",
    displayName: "Custom Size",
    width: 1200,
    height: 1200,
    aspectRatio: "1:1",
    minResolution: 72,
    maxFileSize: 10,
    format: ["jpg", "jpeg", "png"],
    guidelines: {
      backgroundColor: "#FFFFFF",
      textSafeZone: { top: 60, right: 60, bottom: 60, left: 60 },
      productImageMaxSize: 65,
      titleFontSize: { min: 36, max: 48 },
      descriptionFontSize: { min: 24, max: 32 },
      recommendedFonts: ["Inter", "Roboto", "Open Sans"],
    },
    composition: {
      productPosition: { x: 50, y: 45 },
      productScale: 55,
      titlePosition: { x: 50, y: 12 },
      descriptionPosition: { x: 50, y: 82 },
    },
  },
};

export function getTemplateById(templateId: string): MarketplaceTemplate {
  return MARKETPLACE_TEMPLATES[templateId] || MARKETPLACE_TEMPLATES.custom;
}

export function getAllTemplates(): MarketplaceTemplate[] {
  return Object.values(MARKETPLACE_TEMPLATES);
}
