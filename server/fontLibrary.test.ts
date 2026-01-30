import { describe, expect, it } from "vitest";
import { FONT_LIBRARY, getFontByFamily, getFontsByCategory, getCyrillicFonts } from "../shared/fontLibrary";

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
        expect(font).toHaveProperty("cyrillicSupport");
        expect(font.weights).toBeInstanceOf(Array);
        expect(font.weights.length).toBeGreaterThan(0);
      });
    });

    it("all fonts support Cyrillic", () => {
      FONT_LIBRARY.forEach((font) => {
        expect(font.cyrillicSupport).toBe(true);
      });
    });

    it("all fonts have valid categories", () => {
      const validCategories = ["sans-serif", "serif", "display"];
      FONT_LIBRARY.forEach((font) => {
        expect(validCategories).toContain(font.category);
      });
    });

    it("includes popular Cyrillic fonts", () => {
      const fontNames = FONT_LIBRARY.map((f) => f.family);
      expect(fontNames).toContain("Roboto");
      expect(fontNames).toContain("Montserrat");
      expect(fontNames).toContain("PT Sans");
      expect(fontNames).toContain("Open Sans");
    });
  });

  describe("getFontByFamily", () => {
    it("returns font when family exists", () => {
      const font = getFontByFamily("Roboto");
      expect(font).toBeDefined();
      expect(font?.family).toBe("Roboto");
      expect(font?.name).toBe("Roboto");
      expect(font?.cyrillicSupport).toBe(true);
    });

    it("returns undefined when family does not exist", () => {
      const font = getFontByFamily("NonExistentFont");
      expect(font).toBeUndefined();
    });

    it("is case-sensitive", () => {
      const font = getFontByFamily("roboto");
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

  describe("getCyrillicFonts", () => {
    it("returns all Cyrillic-compatible fonts", () => {
      const fonts = getCyrillicFonts();
      expect(fonts.length).toBe(FONT_LIBRARY.length); // All fonts support Cyrillic
      fonts.forEach((font) => {
        expect(font.cyrillicSupport).toBe(true);
      });
    });
  });
});
