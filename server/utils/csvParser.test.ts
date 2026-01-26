import { describe, it, expect } from "vitest";
import { parseCSV } from "./csvParser";

describe("CSV Parser", () => {
  it("should parse a valid CSV with required columns", () => {
    const csv = `SKU,Name,Description,Category,Price
PROD001,Widget A,A great widget,Electronics,29.99
PROD002,Widget B,Another widget,Electronics,39.99`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      sku: "PROD001",
      name: "Widget A",
      description: "A great widget",
      category: "Electronics",
      price: "29.99",
      rawData: expect.any(Object),
    });
  });

  it("should handle quoted values with commas", () => {
    const csv = `SKU,Name,Description
PROD001,"Widget A, Premium","A great widget, really"`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Widget A, Premium");
    expect(result[0].description).toBe("A great widget, really");
  });

  it("should throw error if required columns are missing", () => {
    const csv = `Name,Description
Widget A,A great widget`;

    expect(() => parseCSV(csv)).toThrow("CSV must contain");
  });

  it("should skip empty lines", () => {
    const csv = `SKU,Name

PROD001,Widget A

PROD002,Widget B`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
  });

  it("should handle case-insensitive column names", () => {
    const csv = `sku,product_name,description
PROD001,Widget A,A great widget`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].sku).toBe("PROD001");
    expect(result[0].name).toBe("Widget A");
  });

  it("should throw error if no valid products found", () => {
    const csv = `SKU,Name
,`;

    expect(() => parseCSV(csv)).toThrow("No valid products found");
  });

  it("should throw error if CSV has only header", () => {
    const csv = `SKU,Name`;

    expect(() => parseCSV(csv)).toThrow("must contain at least");
  });
});
