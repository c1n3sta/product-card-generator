import { describe, it, expect } from "vitest";

describe("Pixelcut Service Configuration", () => {
  it("should have PIXELCUT_API_KEY configured", () => {
    const apiKey = process.env.PIXELCUT_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk_/);
  });

  it("should validate API key format", () => {
    const apiKey = process.env.PIXELCUT_API_KEY;
    if (apiKey) {
      expect(apiKey.startsWith("sk_")).toBe(true);
      expect(apiKey.length).toBeGreaterThan(10);
    }
  });
});
