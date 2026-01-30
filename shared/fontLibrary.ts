export interface FontOption {
  name: string;
  family: string;
  category: "sans-serif" | "serif" | "display";
  description: string;
  weights: number[];
  cyrillicSupport: boolean;
}

/**
 * Font library with full Cyrillic character support
 * All fonts are verified to support Russian text
 */
export const FONT_LIBRARY: FontOption[] = [
  {
    name: "Roboto",
    family: "Roboto",
    category: "sans-serif",
    description: "Универсальный шрифт для любого контента",
    weights: [300, 400, 500, 700, 900],
    cyrillicSupport: true,
  },
  {
    name: "Open Sans",
    family: "Open Sans",
    category: "sans-serif",
    description: "Дружелюбный и читаемый",
    weights: [300, 400, 600, 700, 800],
    cyrillicSupport: true,
  },
  {
    name: "Montserrat",
    family: "Montserrat",
    category: "sans-serif",
    description: "Современный геометрический шрифт",
    weights: [300, 400, 500, 600, 700, 800, 900],
    cyrillicSupport: true,
  },
  {
    name: "Oswald",
    family: "Oswald",
    category: "display",
    description: "Выразительный заголовочный шрифт",
    weights: [300, 400, 500, 600, 700],
    cyrillicSupport: true,
  },
  {
    name: "Raleway",
    family: "Raleway",
    category: "sans-serif",
    description: "Элегантный и утонченный",
    weights: [300, 400, 500, 600, 700, 800, 900],
    cyrillicSupport: true,
  },
  {
    name: "PT Sans",
    family: "PT Sans",
    category: "sans-serif",
    description: "Российский шрифт для веб-типографики",
    weights: [400, 700],
    cyrillicSupport: true,
  },
  {
    name: "PT Serif",
    family: "PT Serif",
    category: "serif",
    description: "Классический шрифт с засечками",
    weights: [400, 700],
    cyrillicSupport: true,
  },
  {
    name: "Noto Sans",
    family: "Noto Sans",
    category: "sans-serif",
    description: "Универсальный шрифт от Google",
    weights: [300, 400, 500, 600, 700, 800, 900],
    cyrillicSupport: true,
  },
  {
    name: "Ubuntu",
    family: "Ubuntu",
    category: "sans-serif",
    description: "Современный и дружелюбный",
    weights: [300, 400, 500, 700],
    cyrillicSupport: true,
  },
  {
    name: "Comfortaa",
    family: "Comfortaa",
    category: "display",
    description: "Округлый и мягкий",
    weights: [300, 400, 500, 600, 700],
    cyrillicSupport: true,
  },
  {
    name: "Exo 2",
    family: "Exo 2",
    category: "sans-serif",
    description: "Технологичный и современный",
    weights: [300, 400, 500, 600, 700, 800, 900],
    cyrillicSupport: true,
  },
  {
    name: "Jura",
    family: "Jura",
    category: "sans-serif",
    description: "Футуристичный дизайн",
    weights: [300, 400, 500, 600, 700],
    cyrillicSupport: true,
  },
  {
    name: "Marck Script",
    family: "Marck Script",
    category: "display",
    description: "Рукописный шрифт",
    weights: [400],
    cyrillicSupport: true,
  },
  {
    name: "Caveat",
    family: "Caveat",
    category: "display",
    description: "Естественный рукописный стиль",
    weights: [400, 500, 600, 700],
    cyrillicSupport: true,
  },
];

export function getFontByFamily(family: string): FontOption | undefined {
  return FONT_LIBRARY.find((font) => font.family === family);
}

export function getFontsByCategory(category: "sans-serif" | "serif" | "display"): FontOption[] {
  return FONT_LIBRARY.filter((font) => font.category === category);
}

export function getCyrillicFonts(): FontOption[] {
  return FONT_LIBRARY.filter((font) => font.cyrillicSupport);
}
