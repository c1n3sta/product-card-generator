/**
 * Design Composition Utilities
 * 
 * This module provides utilities for creating visually balanced product cards
 * following established design principles:
 * - Golden Ratio for proportions
 * - Rule of Thirds for positioning
 * - 8px Grid System for spacing
 * - Typography Scale
 */

// Golden ratio constant
export const GOLDEN_RATIO = 1.618;

// Standard card dimensions based on golden ratio
export const CARD_DIMENSIONS = {
  width: 1200,
  height: Math.round(1200 / GOLDEN_RATIO), // ~741px
} as const;

// 8px grid system for consistent spacing
export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  xxxl: 96,
} as const;

// Typography scale based on modular scale (1.25 ratio)
export const TYPOGRAPHY = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  display: 48,
  hero: 64,
} as const;

// Font weights
export const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Calculate rule of thirds positions
 * Returns x and y coordinates for the 9 intersection points
 */
export function getRuleOfThirdsPoints(width: number, height: number) {
  const xThird = width / 3;
  const yThird = height / 3;

  return {
    // Horizontal lines
    topThird: yThird,
    middleThird: yThird * 2,
    bottomThird: height,
    
    // Vertical lines
    leftThird: xThird,
    centerThird: xThird * 2,
    rightThird: width,
    
    // Intersection points (power points)
    topLeft: { x: xThird, y: yThird },
    topRight: { x: xThird * 2, y: yThird },
    bottomLeft: { x: xThird, y: yThird * 2 },
    bottomRight: { x: xThird * 2, y: yThird * 2 },
    
    // Center points
    center: { x: width / 2, y: height / 2 },
    topCenter: { x: width / 2, y: yThird },
    bottomCenter: { x: width / 2, y: yThird * 2 },
    leftCenter: { x: xThird, y: height / 2 },
    rightCenter: { x: xThird * 2, y: height / 2 },
  };
}

/**
 * Calculate optimal image scale to fit within bounds while maintaining aspect ratio
 */
export function calculateImageScale(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number,
  mode: "contain" | "cover" = "contain"
): number {
  const widthRatio = maxWidth / imageWidth;
  const heightRatio = maxHeight / imageHeight;

  if (mode === "contain") {
    return Math.min(widthRatio, heightRatio);
  } else {
    return Math.max(widthRatio, heightRatio);
  }
}

/**
 * Layout configuration for product cards
 */
export interface CardLayout {
  productImage: {
    position: { x: number; y: number };
    maxWidth: number;
    maxHeight: number;
  };
  title: {
    position: { x: number; y: number };
    maxWidth: number;
    fontSize: number;
    fontWeight: number;
  };
  description: {
    position: { x: number; y: number };
    maxWidth: number;
    fontSize: number;
    lineHeight: number;
  };
  background: {
    width: number;
    height: number;
  };
}

/**
 * Generate layout configuration based on composition style
 */
export function generateLayout(
  style: "left-focus" | "center-focus" | "right-focus" = "left-focus"
): CardLayout {
  const { width, height } = CARD_DIMENSIONS;
  const thirds = getRuleOfThirdsPoints(width, height);

  switch (style) {
    case "left-focus":
      // Product on left third, text on right two-thirds
      return {
        productImage: {
          position: { x: thirds.leftThird, y: height / 2 },
          maxWidth: width * 0.4,
          maxHeight: height * 0.7,
        },
        title: {
          position: { x: thirds.centerThird, y: height / 2 - SPACING.xl },
          maxWidth: width / 3 - SPACING.lg,
          fontSize: TYPOGRAPHY.display,
          fontWeight: FONT_WEIGHTS.bold,
        },
        description: {
          position: { x: thirds.centerThird, y: height / 2 + SPACING.sm },
          maxWidth: width / 3 - SPACING.lg,
          fontSize: TYPOGRAPHY.lg,
          lineHeight: 1.6,
        },
        background: {
          width,
          height,
        },
      };

    case "center-focus":
      // Product centered, text below
      return {
        productImage: {
          position: { x: width / 2, y: thirds.topThird + SPACING.xl },
          maxWidth: width * 0.5,
          maxHeight: height * 0.5,
        },
        title: {
          position: { x: width / 2, y: thirds.middleThird + SPACING.md },
          maxWidth: width * 0.7,
          fontSize: TYPOGRAPHY.xxxl,
          fontWeight: FONT_WEIGHTS.bold,
        },
        description: {
          position: { x: width / 2, y: thirds.middleThird + SPACING.xl + SPACING.md },
          maxWidth: width * 0.6,
          fontSize: TYPOGRAPHY.base,
          lineHeight: 1.6,
        },
        background: {
          width,
          height,
        },
      };

    case "right-focus":
      // Product on right third, text on left two-thirds
      return {
        productImage: {
          position: { x: thirds.centerThird, y: height / 2 },
          maxWidth: width * 0.4,
          maxHeight: height * 0.7,
        },
        title: {
          position: { x: SPACING.xl, y: height / 2 - SPACING.xl },
          maxWidth: width / 3 - SPACING.lg,
          fontSize: TYPOGRAPHY.display,
          fontWeight: FONT_WEIGHTS.bold,
        },
        description: {
          position: { x: SPACING.xl, y: height / 2 + SPACING.sm },
          maxWidth: width / 3 - SPACING.lg,
          fontSize: TYPOGRAPHY.lg,
          lineHeight: 1.6,
        },
        background: {
          width,
          height,
        },
      };

    default:
      return generateLayout("left-focus");
  }
}

/**
 * Calculate visual weight for balanced composition
 * Larger, darker, more saturated elements have more visual weight
 */
export function calculateVisualWeight(
  size: number,
  brightness: number, // 0-1, where 1 is white
  saturation: number // 0-1
): number {
  const sizeWeight = size / 1000; // Normalize size
  const brightnessWeight = 1 - brightness; // Darker = more weight
  const saturationWeight = saturation * 0.5; // Saturation adds weight
  
  return sizeWeight + brightnessWeight + saturationWeight;
}

/**
 * Validate if a layout is balanced
 * Returns true if the composition follows design principles
 */
export function isLayoutBalanced(layout: CardLayout): boolean {
  const { width, height } = CARD_DIMENSIONS;
  
  // Check if elements are positioned near rule of thirds points
  const thirds = getRuleOfThirdsPoints(width, height);
  const tolerance = 50; // pixels
  
  const productNearThird = 
    Math.abs(layout.productImage.position.x - thirds.leftThird) < tolerance ||
    Math.abs(layout.productImage.position.x - thirds.centerThird) < tolerance ||
    Math.abs(layout.productImage.position.x - thirds.rightThird) < tolerance;
  
  // Check if spacing follows 8px grid
  const spacingValid = 
    layout.title.position.y % SPACING.xs === 0 &&
    layout.description.position.y % SPACING.xs === 0;
  
  // Check if typography scale is used
  const typographyValid = 
    Object.values(TYPOGRAPHY).includes(layout.title.fontSize) &&
    Object.values(TYPOGRAPHY).includes(layout.description.fontSize);
  
  return productNearThird && spacingValid && typographyValid;
}

/**
 * Snap value to 8px grid
 */
export function snapToGrid(value: number, gridSize: number = SPACING.xs): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Get contrasting text color for a background color
 */
export function getContrastingColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

/**
 * Generate a harmonious color palette from an accent color
 */
export function generateColorPalette(accentColor: string) {
  // This is a simplified version - in production, use a proper color theory library
  return {
    primary: accentColor,
    secondary: adjustColorBrightness(accentColor, 20),
    tertiary: adjustColorBrightness(accentColor, -20),
    text: getContrastingColor(accentColor),
    background: "#FFFFFF",
    surface: "#F8F9FA",
  };
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(hexColor: string, percent: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const adjust = (value: number) => {
    const adjusted = value + (value * percent) / 100;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };
  
  const newR = adjust(r).toString(16).padStart(2, "0");
  const newG = adjust(g).toString(16).padStart(2, "0");
  const newB = adjust(b).toString(16).padStart(2, "0");
  
  return `#${newR}${newG}${newB}`;
}
