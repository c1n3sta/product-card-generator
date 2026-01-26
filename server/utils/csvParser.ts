/**
 * CSV Parser utility for extracting product data
 */

export interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price?: string;
  rawData: Record<string, string>;
}

export function parseCSV(csvContent: string): ParsedProduct[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  
  // Find required columns (case-insensitive)
  const skuIndex = headers.findIndex(h => h.toLowerCase() === 'sku' || h.toLowerCase() === 'product_id');
  const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name' || h.toLowerCase() === 'product_name' || h.toLowerCase() === 'title');
  
  if (skuIndex === -1 || nameIndex === -1) {
    throw new Error('CSV must contain "SKU" and "Name" columns');
  }

  // Parse data rows
  const products: ParsedProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    if (values.length < Math.max(skuIndex, nameIndex) + 1) {
      console.warn(`Row ${i + 1} has insufficient columns, skipping`);
      continue;
    }

    // Build raw data object
    const rawData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rawData[header] = values[index] || '';
    });

    const product: ParsedProduct = {
      sku: values[skuIndex]?.trim() || '',
      name: values[nameIndex]?.trim() || '',
      description: values[headers.findIndex(h => h.toLowerCase() === 'description')] || undefined,
      category: values[headers.findIndex(h => h.toLowerCase() === 'category')] || undefined,
      price: values[headers.findIndex(h => h.toLowerCase() === 'price')] || undefined,
      rawData,
    };

    if (product.sku && product.name) {
      products.push(product);
    }
  }

  if (products.length === 0) {
    throw new Error('No valid products found in CSV');
  }

  return products;
}

/**
 * Parse a single CSV line, handling quoted values and commas within quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());
  return result;
}
