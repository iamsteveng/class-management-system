/**
 * Product-to-class ID mapping configuration.
 *
 * Maps external product IDs (from S3 purchase CSV files) to internal class_id strings,
 * keyed by environment (dev | uat | prod).
 *
 * Example structure:
 * {
 *   dev: {
 *     "PRODUCT_001": "class_abc123",
 *     "PRODUCT_002": "class_def456",
 *   },
 *   uat: {
 *     "PRODUCT_001": "class_xyz789",
 *   },
 *   prod: {
 *     "PRODUCT_001": "class_prod111",
 *     "PRODUCT_002": "class_prod222",
 *   },
 * }
 *
 * Add entries here when a new product ID needs to map to a class.
 * If a product ID is not found, the ingestion row will be skipped with a warning.
 */
export const productMapping: Record<string, Record<string, string>> = {
  dev: {
    // Add dev mappings here when needed
  },
  uat: {
    "6": "class_cycling_fundamentals",
    "7": "class_city_guided_tour",
  },
  prod: {
    // Add prod mappings here when ready
  },
};

/**
 * Resolves a product_id to a class_id for the given environment.
 * Returns undefined if the product_id is not found in the mapping.
 */
export function resolveClassId(
  env: string,
  productId: string
): string | undefined {
  const envMapping = productMapping[env] ?? {};
  return envMapping[productId];
}
