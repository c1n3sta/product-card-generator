export interface FontOption {
  name: string;
  family: string;
  category: "sans-serif" | "serif" | "display";
  description: string;
  weights: number[];
}

export const FONT_LIBRARY: FontOption[] = [
  {
    name: "Inter",
    family: "Inter",
    category: "sans-serif",
    description: "Modern, clean, and highly readable",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    name: "Roboto",
    family: "Roboto",
    category: "sans-serif",
    description: "Friendly and professional",
    weights: [400, 500, 700, 900],
  },
  {
    name: "Montserrat",
    family: "Montserrat",
    category: "sans-serif",
    description: "Bold and geometric",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    name: "Poppins",
    family: "Poppins",
    category: "sans-serif",
    description: "Rounded and friendly",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    name: "Raleway",
    family: "Raleway",
    category: "sans-serif",
    description: "Elegant and sophisticated",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    name: "Lato",
    family: "Lato",
    category: "sans-serif",
    description: "Warm and stable",
    weights: [400, 700, 900],
  },
  {
    name: "Open Sans",
    family: "Open Sans",
    category: "sans-serif",
    description: "Neutral and friendly",
    weights: [400, 600, 700, 800],
  },
  {
    name: "Oswald",
    family: "Oswald",
    category: "display",
    description: "Condensed and impactful",
    weights: [400, 500, 600, 700],
  },
  {
    name: "Playfair Display",
    family: "Playfair Display",
    category: "serif",
    description: "Elegant and luxurious",
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    name: "Merriweather",
    family: "Merriweather",
    category: "serif",
    description: "Classic and readable",
    weights: [400, 700, 900],
  },
];

export function getFontByFamily(family: string): FontOption | undefined {
  return FONT_LIBRARY.find((font) => font.family === family);
}

export function getFontsByCategory(category: "sans-serif" | "serif" | "display"): FontOption[] {
  return FONT_LIBRARY.filter((font) => font.category === category);
}
