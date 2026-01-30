import { describe, expect, it } from "vitest";
import { parseCSV, generateCSVTemplate } from "./csvParser";

describe("CSV Parser", () => {
  describe("parseCSV", () => {
    it("should parse a valid CSV with all fields", () => {
      const csv = `sku,name,description,category,price,image_url
SKU001,Test Product,A test description,Electronics,99.99,https://example.com/image.jpg`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.products).toHaveLength(1);
      expect(result.products[0]).toEqual({
        sku: "SKU001",
        name: "Test Product",
        description: "A test description",
        category: "Electronics",
        price: "99.99",
        imageUrl: "https://example.com/image.jpg",
      });
      expect(result.validRows).toBe(1);
      expect(result.totalRows).toBe(1);
    });

    it("should parse CSV with only required name field", () => {
      const csv = `name
Product A
Product B`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.products).toHaveLength(2);
      expect(result.products[0].name).toBe("Product A");
      expect(result.products[1].name).toBe("Product B");
    });

    it("should handle semicolon delimiter", () => {
      const csv = `sku;name;price
SKU001;Test Product;29.99`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].sku).toBe("SKU001");
      expect(result.products[0].name).toBe("Test Product");
      expect(result.products[0].price).toBe("29.99");
    });

    it("should handle quoted fields with commas", () => {
      const csv = `name,description
"Product, with comma","Description with ""quotes"" inside"`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.products[0].name).toBe("Product, with comma");
      expect(result.products[0].description).toBe('Description with "quotes" inside');
    });

    it("should fail when name column is missing", () => {
      const csv = `sku,price
SKU001,99.99`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("CSV must contain a 'name' or 'product_name' column");
    });

    it("should fail for empty CSV", () => {
      const result = parseCSV("");

      expect(result.success).toBe(false);
      expect(result.errors).toContain("CSV file is empty");
    });

    it("should skip rows with missing name", () => {
      const csv = `name,price
Product A,10.00
,20.00
Product C,30.00`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.products).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Missing product name");
    });

    it("should handle alternative header names", () => {
      const csv = `product_name,product_sku,product_category
My Product,ABC123,Home`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.products[0].name).toBe("My Product");
      expect(result.products[0].sku).toBe("ABC123");
      expect(result.products[0].category).toBe("Home");
    });
  });

  describe("generateCSVTemplate", () => {
    it("should generate a valid CSV template", () => {
      const template = generateCSVTemplate();

      expect(template).toContain("sku,name,description,category,price,image_url");
      expect(template).toContain("SKU001");
      expect(template).toContain("Premium Wireless Headphones");
    });

    it("should be parseable by parseCSV", () => {
      const template = generateCSVTemplate();
      const result = parseCSV(template);

      expect(result.success).toBe(true);
      expect(result.products.length).toBeGreaterThan(0);
    });
  });
});
