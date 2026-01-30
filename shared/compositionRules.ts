/**
 * Composition Rules for Product Card Layouts
 * Implements golden ratio, rule of thirds, and marketplace-specific guidelines
 */

export interface CompositionPoint {
  x: number;
  y: number;
}

export interface CompositionGuide {
  points: CompositionPoint[];
  lines: { start: CompositionPoint; end: CompositionPoint }[];
}

export interface LayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardLayout {
  background: LayoutPosition;
  productImage: LayoutPosition;
  title: LayoutPosition;
  description: LayoutPosition;
  safeZone: LayoutPosition;
}

const GOLDEN_RATIO = 1.618;
const RULE_OF_THIRDS = 1 / 3;

/**
 * Calculate golden ratio points for a given canvas size
 */
export function getGoldenRatioPoints(width: number, height: number): CompositionPoint[] {
  const goldenX = width / GOLDEN_RATIO;
  const goldenY = height / GOLDEN_RATIO;

  return [
    { x: goldenX, y: goldenY }, // Primary golden point
    { x: width - goldenX, y: goldenY }, // Secondary horizontal
    { x: goldenX, y: height - goldenY }, // Secondary vertical
    { x: width - goldenX, y: height - goldenY }, // Tertiary
  ];
}

/**
 * Calculate rule of thirds points for a given canvas size
 */
export function getRuleOfThirdsPoints(width: number, height: number): CompositionPoint[] {
  const thirdX = width * RULE_OF_THIRDS;
  const twoThirdsX = width * (2 * RULE_OF_THIRDS);
  const thirdY = height * RULE_OF_THIRDS;
  const twoThirdsY = height * (2 * RULE_OF_THIRDS);

  return [
    { x: thirdX, y: thirdY },
    { x: twoThirdsX, y: thirdY },
    { x: thirdX, y: twoThirdsY },
    { x: twoThirdsX, y: twoThirdsY },
  ];
}

/**
 * Get composition guide lines for rule of thirds
 */
export function getCompositionGuide(width: number, height: number): CompositionGuide {
  const thirdX = width * RULE_OF_THIRDS;
  const twoThirdsX = width * (2 * RULE_OF_THIRDS);
  const thirdY = height * RULE_OF_THIRDS;
  const twoThirdsY = height * (2 * RULE_OF_THIRDS);

  return {
    points: getRuleOfThirdsPoints(width, height),
    lines: [
      // Vertical lines
      { start: { x: thirdX, y: 0 }, end: { x: thirdX, y: height } },
      { start: { x: twoThirdsX, y: 0 }, end: { x: twoThirdsX, y: height } },
      // Horizontal lines
      { start: { x: 0, y: thirdY }, end: { x: width, y: thirdY } },
      { start: { x: 0, y: twoThirdsY }, end: { x: width, y: twoThirdsY } },
    ],
  };
}

/**
 * Generate optimal card layout based on marketplace template and composition rules
 */
export function generateCardLayout(
  width: number,
  height: number,
  templateName: string = "custom",
  safeZonePercent: number = 5
): CardLayout {
  const safeZone = {
    x: width * (safeZonePercent / 100),
    y: height * (safeZonePercent / 100),
    width: width * (1 - (2 * safeZonePercent) / 100),
    height: height * (1 - (2 * safeZonePercent) / 100),
  };

  // Get golden ratio and rule of thirds points
  const goldenPoints = getGoldenRatioPoints(width, height);
  const thirdsPoints = getRuleOfThirdsPoints(width, height);

  // Calculate product image size (40-50% of canvas width)
  const productImageWidth = width * 0.45;
  const productImageHeight = productImageWidth; // Square aspect for product

  // Position product image at golden ratio point (left-center)
  const productImageX = goldenPoints[0].x - productImageWidth / 2;
  const productImageY = height / 2 - productImageHeight / 2;

  // Title positioned at top third, right of product
  const titleX = safeZone.x;
  const titleY = safeZone.y + height * 0.1;
  const titleWidth = safeZone.width;
  const titleHeight = height * 0.15;

  // Description positioned at bottom third
  const descriptionX = safeZone.x;
  const descriptionY = height - safeZone.y - height * 0.2;
  const descriptionWidth = safeZone.width;
  const descriptionHeight = height * 0.15;

  // Marketplace-specific adjustments
  switch (templateName.toLowerCase()) {
    case "wildberries":
      // Wildberries prefers centered product with text below
      return {
        background: { x: 0, y: 0, width, height },
        productImage: {
          x: width / 2 - productImageWidth / 2,
          y: height * 0.25,
          width: productImageWidth,
          height: productImageHeight,
        },
        title: {
          x: safeZone.x,
          y: height * 0.65,
          width: safeZone.width,
          height: height * 0.12,
        },
        description: {
          x: safeZone.x,
          y: height * 0.78,
          width: safeZone.width,
          height: height * 0.15,
        },
        safeZone,
      };

    case "ozon":
      // Ozon prefers product on left, text on right
      return {
        background: { x: 0, y: 0, width, height },
        productImage: {
          x: width * 0.1,
          y: height / 2 - productImageHeight / 2,
          width: productImageWidth,
          height: productImageHeight,
        },
        title: {
          x: width * 0.55,
          y: height * 0.3,
          width: width * 0.4,
          height: height * 0.15,
        },
        description: {
          x: width * 0.55,
          y: height * 0.5,
          width: width * 0.4,
          height: height * 0.2,
        },
        safeZone,
      };

    case "yandex_market":
      // Yandex Market prefers balanced composition
      return {
        background: { x: 0, y: 0, width, height },
        productImage: {
          x: thirdsPoints[0].x - productImageWidth / 2,
          y: height / 2 - productImageHeight / 2,
          width: productImageWidth,
          height: productImageHeight,
        },
        title: {
          x: safeZone.x,
          y: safeZone.y,
          width: safeZone.width,
          height: height * 0.12,
        },
        description: {
          x: safeZone.x,
          y: height - safeZone.y - height * 0.18,
          width: safeZone.width,
          height: height * 0.15,
        },
        safeZone,
      };

    case "avito":
      // Avito prefers simple centered layout
      return {
        background: { x: 0, y: 0, width, height },
        productImage: {
          x: width / 2 - productImageWidth / 2,
          y: height * 0.3,
          width: productImageWidth,
          height: productImageHeight,
        },
        title: {
          x: safeZone.x,
          y: height * 0.7,
          width: safeZone.width,
          height: height * 0.1,
        },
        description: {
          x: safeZone.x,
          y: height * 0.82,
          width: safeZone.width,
          height: height * 0.12,
        },
        safeZone,
      };

    default:
      // Custom/default layout using golden ratio
      return {
        background: { x: 0, y: 0, width, height },
        productImage: {
          x: productImageX,
          y: productImageY,
          width: productImageWidth,
          height: productImageHeight,
        },
        title: {
          x: titleX,
          y: titleY,
          width: titleWidth,
          height: titleHeight,
        },
        description: {
          x: descriptionX,
          y: descriptionY,
          width: descriptionWidth,
          height: descriptionHeight,
        },
        safeZone,
      };
  }
}

/**
 * Calculate optimal font size based on container dimensions and text length
 */
export function calculateOptimalFontSize(
  textLength: number,
  containerWidth: number,
  containerHeight: number,
  isTitle: boolean = false
): number {
  const baseSize = isTitle ? 48 : 24;
  const minSize = isTitle ? 24 : 14;
  const maxSize = isTitle ? 72 : 32;

  // Reduce font size for longer text
  const lengthFactor = Math.max(0.5, 1 - textLength / 100);
  const calculatedSize = baseSize * lengthFactor;

  // Clamp to min/max
  return Math.max(minSize, Math.min(maxSize, calculatedSize));
}

/**
 * Snap position to nearest composition guide point
 */
export function snapToGuide(
  x: number,
  y: number,
  width: number,
  height: number,
  snapThreshold: number = 20
): CompositionPoint {
  const guides = [
    ...getGoldenRatioPoints(width, height),
    ...getRuleOfThirdsPoints(width, height),
  ];

  let closestPoint = { x, y };
  let minDistance = snapThreshold;

  for (const guide of guides) {
    const distance = Math.sqrt(Math.pow(x - guide.x, 2) + Math.pow(y - guide.y, 2));
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = guide;
    }
  }

  return closestPoint;
}
