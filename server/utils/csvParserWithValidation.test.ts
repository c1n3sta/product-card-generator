import { describe, expect, it } from "vitest";
import { parseCSVWithValidation } from "./csvParserWithValidation";

describe("parseCSVWithValidation", () => {
  it("should parse valid CSV with all fields", () => {
    const csv = `sku,name,description,category,price
PROD-001,Test Product,A great product,Electronics,99.99
PROD-002,Another Product,Even better,Home,149.99`;

    const result = parseCSVWithValidation(csv);

    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      sku: "PROD-001",
      name: "Test Product",
      description: "A great product",
      category: "Electronics",
      price: "99.99",
      errors: [],
    });
  });

  it("should handle missing optional fields", () => {
    const csv = `name
Product Without Details`;

    const result = parseCSVWithValidation(csv);

    expect(result.validCount).toBe(1);
    expect(result.rows[0]).toMatchObject({
      name: "Product Without Details",
      sku: undefined,
      description: undefined,
      category: undefined,
      price: undefined,
      errors: [],
    });
  });

  it("should detect missing required name field", () => {
    const csv = `sku,name,description
PROD-001,,Some description`;

    const result = parseCSVWithValidation(csv);

    expect(result.invalidCount).toBe(1);
    expect(result.rows[0].errors).toContain("Product name is required");
  });

  it("should handle names that are too long", () => {
    const longName = "A".repeat(501);
    const csv = `name\n${longName}`;

    const result = parseCSVWithValidation(csv);

    expect(result.invalidCount).toBe(1);
    expect(result.rows[0].errors).toContain("Product name is too long (max 500 characters)");
  });

  it("should add warnings for missing optional but recommended fields", () => {
    const csv = `name
Minimal Product`;

    const result = parseCSVWithValidation(csv);

    expect(result.validCount).toBe(1);
    expect(result.rows[0].warnings.length).toBeGreaterThan(0);
    expect(result.rows[0].warnings.some((w) => w.includes("Description"))).toBe(true);
  });

  it("should handle CSV with quoted values containing commas", () => {
    const csv = `name,description,price
"Product, with comma","Description, also with comma","1,999.99"`;

    const result = parseCSVWithValidation(csv);

    expect(result.validCount).toBe(1);
    expect(result.rows[0].name).toBe("Product, with comma");
    expect(result.rows[0].description).toBe("Description, also with comma");
  });

  it("should throw error for empty CSV", () => {
    expect(() => parseCSVWithValidation("")).toThrow("CSV file is empty");
  });

  it("should throw error for missing required columns", () => {
    const csv = `sku,description\nPROD-001,Test`;

    expect(() => parseCSVWithValidation(csv)).toThrow("Missing required columns: name");
  });

  it("should skip empty lines", () => {
    const csv = `name
Product 1

Product 2

`;

    const result = parseCSVWithValidation(csv);

    expect(result.rows).toHaveLength(2);
    expect(result.validCount).toBe(2);
  });

  it("should handle Russian text and currency symbols", () => {
    const csv = `name,price,category
Товар,3 250 000 ₽,Электроника`;

    const result = parseCSVWithValidation(csv);

    expect(result.validCount).toBe(1);
    expect(result.rows[0].name).toBe("Товар");
    expect(result.rows[0].price).toBe("3 250 000 ₽");
    expect(result.rows[0].category).toBe("Электроника");
  });
});
