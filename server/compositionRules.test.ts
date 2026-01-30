import { describe, expect, it } from "vitest";
import {
  getGoldenRatioPoints,
  getRuleOfThirdsPoints,
  getCompositionGuide,
  generateCardLayout,
  calculateOptimalFontSize,
  snapToGuide,
} from "../shared/compositionRules";

describe("compositionRules", () => {
  describe("getGoldenRatioPoints", () => {
    it("calculates golden ratio points correctly", () => {
      const points = getGoldenRatioPoints(1000, 1000);
      
      expect(points).toHaveLength(4);
      expect(points[0].x).toBeCloseTo(618, 0); // 1000 / 1.618
      expect(points[0].y).toBeCloseTo(618, 0);
    });
  });

  describe("getRuleOfThirdsPoints", () => {
    it("calculates rule of thirds points correctly", () => {
      const points = getRuleOfThirdsPoints(900, 1200);
      
      expect(points).toHaveLength(4);
      expect(points[0].x).toBe(300); // 900 / 3
      expect(points[0].y).toBe(400); // 1200 / 3
      expect(points[3].x).toBe(600); // 900 * 2/3
      expect(points[3].y).toBe(800); // 1200 * 2/3
    });
  });

  describe("getCompositionGuide", () => {
    it("generates composition guide with lines and points", () => {
      const guide = getCompositionGuide(1000, 1000);
      
      expect(guide.points).toHaveLength(4);
      expect(guide.lines).toHaveLength(4); // 2 vertical + 2 horizontal
    });
  });

  describe("generateCardLayout", () => {
    it("generates layout for Wildberries template", () => {
      const layout = generateCardLayout(900, 1200, "wildberries", 5);
      
      expect(layout.background.width).toBe(900);
      expect(layout.background.height).toBe(1200);
      expect(layout.productImage.width).toBeGreaterThan(0);
      expect(layout.title.width).toBeGreaterThan(0);
      expect(layout.description.width).toBeGreaterThan(0);
    });

    it("generates layout for Ozon template", () => {
      const layout = generateCardLayout(1024, 1024, "ozon", 5);
      
      expect(layout.background.width).toBe(1024);
      expect(layout.background.height).toBe(1024);
    });

    it("generates layout for custom template", () => {
      const layout = generateCardLayout(1000, 1000, "custom", 5);
      
      expect(layout.background.width).toBe(1000);
      expect(layout.background.height).toBe(1000);
      expect(layout.safeZone.x).toBeGreaterThan(0);
      expect(layout.safeZone.y).toBeGreaterThan(0);
    });
  });

  describe("calculateOptimalFontSize", () => {
    it("calculates larger font size for titles", () => {
      const titleSize = calculateOptimalFontSize(20, 800, 100, true);
      const descSize = calculateOptimalFontSize(20, 800, 100, false);
      
      expect(titleSize).toBeGreaterThan(descSize);
    });

    it("reduces font size for longer text", () => {
      const shortSize = calculateOptimalFontSize(10, 800, 100, true);
      const longSize = calculateOptimalFontSize(100, 800, 100, true);
      
      expect(shortSize).toBeGreaterThan(longSize);
    });

    it("respects min and max bounds", () => {
      const veryShortTitle = calculateOptimalFontSize(1, 800, 100, true);
      const veryLongTitle = calculateOptimalFontSize(1000, 800, 100, true);
      
      expect(veryShortTitle).toBeLessThanOrEqual(72); // max for title
      expect(veryLongTitle).toBeGreaterThanOrEqual(24); // min for title
    });
  });

  describe("snapToGuide", () => {
    it("snaps to nearest guide point within threshold", () => {
      const snapped = snapToGuide(335, 335, 1000, 1000, 50);
      
      // Should snap to rule of thirds point at 333.33
      expect(snapped.x).toBeCloseTo(333, 0);
      expect(snapped.y).toBeCloseTo(333, 0);
    });

    it("does not snap if outside threshold", () => {
      const snapped = snapToGuide(100, 100, 1000, 1000, 10);
      
      // Should not snap (too far from any guide)
      expect(snapped.x).toBe(100);
      expect(snapped.y).toBe(100);
    });
  });
});
