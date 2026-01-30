import { describe, expect, it } from "vitest";
import { FONT_LIBRARY, getFontByFamily, getFontsByCategory } from "../shared/fontLibrary";

describe("fontLibrary", () => {
  describe("FONT_LIBRARY", () => {
    it("contains at least 10 fonts", () => {
      expect(FONT_LIBRARY.length).toBeGreaterThanOrEqual(10);
    });

    it("all fonts have required properties", () => {
      FONT_LIBRARY.forEach((font) => {
        expect(font).toHaveProperty("name");
        expect(font).toHaveProperty("family");
        expect(font).toHaveProperty("category");
        expect(font).toHaveProperty("description");
        expect(font).toHaveProperty("weights");
        expect(font.weights).toBeInstanceOf(Array);
        expect(font.weights.length).toBeGreaterThan(0);
      });
    });

    it("all fonts have valid categories", () => {
      const validCategories = ["sans-serif", "serif", "display"];
      FONT_LIBRARY.forEach((font) => {
        expect(validCategories).toContain(font.category);
      });
    });

    it("includes popular fonts", () => {
      const fontNames = FONT_LIBRARY.map((f) => f.family);
      expect(fontNames).toContain("Inter");
      expect(fontNames).toContain("Roboto");
      expect(fontNames).toContain("Montserrat");
      expect(fontNames).toContain("Poppins");
    });
  });

  describe("getFontByFamily", () => {
    it("returns font when family exists", () => {
      const font = getFontByFamily("Inter");
      expect(font).toBeDefined();
      expect(font?.family).toBe("Inter");
      expect(font?.name).toBe("Inter");
    });

    it("returns undefined when family does not exist", () => {
      const font = getFontByFamily("NonExistentFont");
      expect(font).toBeUndefined();
    });

    it("is case-sensitive", () => {
      const font = getFontByFamily("inter");
      expect(font).toBeUndefined();
    });
  });

  describe("getFontsByCategory", () => {
    it("returns all sans-serif fonts", () => {
      const fonts = getFontsByCategory("sans-serif");
      expect(fonts.length).toBeGreaterThan(0);
      fonts.forEach((font) => {
        expect(font.category).toBe("sans-serif");
      });
    });

    it("returns all serif fonts", () => {
      const fonts = getFontsByCategory("serif");
      expect(fonts.length).toBeGreaterThan(0);
      fonts.forEach((font) => {
        expect(font.category).toBe("serif");
      });
    });

    it("returns all display fonts", () => {
      const fonts = getFontsByCategory("display");
      expect(fonts.length).toBeGreaterThan(0);
      fonts.forEach((font) => {
        expect(font.category).toBe("display");
      });
    });

    it("returns empty array for invalid category", () => {
      const fonts = getFontsByCategory("invalid" as any);
      expect(fonts).toEqual([]);
    });
  });
});
