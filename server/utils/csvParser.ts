/**
 * CSV Parser for product data import
 * Handles parsing CSV content with SKU, name, description, category, and price fields
 */

export interface ParsedProduct {
  sku?: string;
  name: string;
  description?: string;
  category?: string;
  price?: string;
  imageUrl?: string;
}

export interface ParseResult {
  success: boolean;
  products: ParsedProduct[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse CSV content into product objects
 * Supports both comma and semicolon delimiters
 * Handles quoted fields with embedded delimiters
 */
export function parseCSV(content: string): ParseResult {
  const errors: string[] = [];
  const products: ParsedProduct[] = [];

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedContent.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    return {
      success: false,
      products: [],
      errors: ["CSV file is empty"],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Detect delimiter (comma or semicolon)
  const headerLine = lines[0];
  const delimiter = headerLine.includes(";") ? ";" : ",";

  // Parse header
  const headers = parseCSVLine(headerLine, delimiter).map((h) => h.toLowerCase().trim());

  // Map header names to standard fields
  const fieldMapping: Record<string, keyof ParsedProduct> = {
    sku: "sku",
    "product_sku": "sku",
    "product sku": "sku",
    name: "name",
    "product_name": "name",
    "product name": "name",
    title: "name",
    description: "description",
    "product_description": "description",
    "product description": "description",
    category: "category",
    "product_category": "category",
    "product category": "category",
    price: "price",
    "product_price": "price",
    "product price": "price",
    image: "imageUrl",
    "image_url": "imageUrl",
    "image url": "imageUrl",
    imageurl: "imageUrl",
  };

  // Find column indices
  const columnIndices: Partial<Record<keyof ParsedProduct, number>> = {};
  headers.forEach((header, index) => {
    const field = fieldMapping[header];
    if (field) {
      columnIndices[field] = index;
    }
  });

  // Check for required name field
  if (columnIndices.name === undefined) {
    return {
      success: false,
      products: [],
      errors: ["CSV must contain a 'name' or 'product_name' column"],
      totalRows: lines.length - 1,
      validRows: 0,
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line, delimiter);
      const product: ParsedProduct = {
        name: "",
      };

      // Map values to product fields
      for (const [field, index] of Object.entries(columnIndices)) {
        if (index !== undefined && values[index] !== undefined) {
          const value = values[index].trim();
          if (value) {
            (product as any)[field] = value;
          }
        }
      }

      // Validate required fields
      if (!product.name) {
        errors.push(`Row ${i + 1}: Missing product name`);
        continue;
      }

      products.push(product);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Parse error"}`);
    }
  }

  return {
    success: products.length > 0,
    products,
    errors,
    totalRows: lines.length - 1,
    validRows: products.length,
  };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

/**
 * Generate a sample CSV template
 */
export function generateCSVTemplate(): string {
  return `sku,name,description,category,price,image_url
SKU001,Premium Wireless Headphones,High-quality noise-canceling headphones with 30-hour battery life,Electronics,149.99,
SKU002,Organic Coffee Beans,Single-origin arabica beans from Colombia,Food & Beverage,24.99,
SKU003,Yoga Mat Pro,Extra thick eco-friendly yoga mat with alignment guides,Sports & Fitness,39.99,`;
}
