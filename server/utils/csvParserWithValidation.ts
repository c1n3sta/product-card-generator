import type { CSVRow } from "../../client/src/components/CSVPreview";

export interface ParsedCSVResult {
  rows: CSVRow[];
  validCount: number;
  invalidCount: number;
}

export function parseCSVWithValidation(csvContent: string): ParsedCSVResult {
  if (!csvContent || csvContent.trim().length === 0) {
    throw new Error("CSV file is empty");
  }
  
  const lines = csvContent.trim().split("\n");
  
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  
  // Validate required columns
  const requiredColumns = ["name"];
  const missingColumns = requiredColumns.filter((col) => !header.includes(col));
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  // Find column indices
  const skuIndex = header.indexOf("sku");
  const nameIndex = header.indexOf("name");
  const descriptionIndex = header.indexOf("description");
  const categoryIndex = header.indexOf("category");
  const priceIndex = header.indexOf("price");

  const rows: CSVRow[] = [];
  let validCount = 0;
  let invalidCount = 0;

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    const rowNumber = i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract values
    const sku = skuIndex >= 0 ? values[skuIndex]?.trim() : undefined;
    const name = nameIndex >= 0 ? values[nameIndex]?.trim() : "";
    const description = descriptionIndex >= 0 ? values[descriptionIndex]?.trim() : undefined;
    const category = categoryIndex >= 0 ? values[categoryIndex]?.trim() : undefined;
    const price = priceIndex >= 0 ? values[priceIndex]?.trim() : undefined;

    // Validation
    if (!name) {
      errors.push("Product name is required");
    } else if (name.length > 500) {
      errors.push("Product name is too long (max 500 characters)");
    }

    if (sku && sku.length > 100) {
      errors.push("SKU is too long (max 100 characters)");
    }

    if (category && category.length > 200) {
      errors.push("Category is too long (max 200 characters)");
    }

    if (description && description.length > 10000) {
      warnings.push("Description is very long and may be truncated");
    }

    // Warnings
    if (!description || description.length < 10) {
      warnings.push("Description is missing or too short - AI generation may be less effective");
    }

    if (!category) {
      warnings.push("Category is missing - consider adding for better organization");
    }

    if (!price) {
      warnings.push("Price is missing");
    }

    if (errors.length > 0) {
      invalidCount++;
    } else {
      validCount++;
    }

    rows.push({
      sku,
      name,
      description,
      category,
      price,
      rowNumber,
      errors,
      warnings,
    });
  }

  return {
    rows,
    validCount,
    invalidCount,
  };
}

/**
 * Parse a CSV line handling quoted values with commas
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}
