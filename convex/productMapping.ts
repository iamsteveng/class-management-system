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
    "26": "67261272-c799-4439-9146-4ee12ce51b7c", // Beginner Cycling Course
    "27": "7fe78618-d6c1-4a35-ad01-a0453a943180", // Guided Bike Tour
    "31": "a7a53c64-8cf0-4b71-9749-7f1076045f99", // 青少年單車新手速成班 (13-17歲)
    "32": "a07413ca-9be9-4492-94d3-da01a93a3e04", // 幼兒單車新手速成班 (6-9歲)
    "33": "a2f45f61-4f3f-4345-84b6-6241c4adb532", // 中童單車新手速成班 (10-12歲)
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
