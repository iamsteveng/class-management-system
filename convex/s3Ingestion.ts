"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { resolveClassId } from "./productMapping";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION ?? "ap-southeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
}

function getBucketName(): string {
  return (
    process.env.S3_BUCKET_NAME ?? "mart-order-887306483832-ap-southeast-1-an"
  );
}

function getAppEnv(): string {
  return process.env.APP_ENV ?? "dev";
}

/**
 * Parses purchase_datetime from filename.
 * Format: YYYYMMDDHHmm---<uuid>.csv  →  "2026-03-27T16:22:00+08:00"
 * The timestamp in the filename is in Hong Kong time (UTC+8).
 */
export function parseDatetimeFromFilename(filename: string): string {
  // Strip directory prefix if present
  const base = filename.split("/").pop() ?? filename;
  // Match 12-digit timestamp at the start: 202603271622
  const match = base.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    return new Date().toISOString();
  }
  const [, yyyy, mm, dd, hh, min] = match;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00+08:00`;
}

/**
 * Parsed row from the S3 purchase CSV.
 * Columns: order_id, product_id, user_phone, qty, unit_price, total
 */
type S3CsvRow = {
  order_id: string;
  product_id: string;
  user_phone: string;
  qty: number;
  unit_price: number;
  total: number;
};

/** Parses the S3 CSV format, trimming whitespace from all values. */
function parseS3Csv(csvText: string): S3CsvRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const required = ["order_id", "product_id", "user_phone", "qty", "unit_price", "total"];
  for (const col of required) {
    if (!header.includes(col)) {
      throw new Error(`CSV missing required column: ${col}`);
    }
  }

  const idx = (col: string) => header.indexOf(col);

  const rows: S3CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const order_id = cells[idx("order_id")] ?? "";
    const product_id = cells[idx("product_id")] ?? "";
    const user_phone = cells[idx("user_phone")] ?? "";
    const qtyRaw = cells[idx("qty")] ?? "";
    const unitPriceRaw = cells[idx("unit_price")] ?? "";
    const totalRaw = cells[idx("total")] ?? "";

    if (!order_id || !product_id || !user_phone) continue;

    const qty = parseInt(qtyRaw, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      console.warn(`[s3Ingestion] Skipping row ${i + 1}: invalid qty "${qtyRaw}"`);
      continue;
    }

    rows.push({
      order_id,
      product_id,
      user_phone,
      qty,
      unit_price: parseFloat(unitPriceRaw) || 0,
      total: parseFloat(totalRaw) || 0,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Actions (node runtime, S3 access)
// ---------------------------------------------------------------------------

/**
 * Downloads a single CSV file from S3, parses it, inserts purchase rows,
 * and moves the file to {ENV}/processed/.
 */
export const processS3File = actionGeneric({
  args: {
    file_key: v.string(),
    bucket: v.string(),
    env: v.string(),
    purchase_datetime: v.string(),
  },
  returns: v.object({
    rows_inserted: v.number(),
    rows_skipped: v.number(),
    whatsapp_errors: v.number(),
  }),
  handler: async (ctx, args) => {
    const s3 = createS3Client();

    console.log(`[s3Ingestion:processS3File] Starting. key=${args.file_key} bucket=${args.bucket} env=${args.env}`);
    // Download the CSV file
    const getResponse = await s3.send(
      new GetObjectCommand({ Bucket: args.bucket, Key: args.file_key })
    );
    if (!getResponse.Body) {
      throw new Error(`No body in S3 response for ${args.file_key}`);
    }
    const csvText = await getResponse.Body.transformToString("utf-8");

    console.log(`[s3Ingestion:processS3File] Downloaded CSV. size=${csvText.length} chars`);
    // Parse CSV rows
    const rawRows = parseS3Csv(csvText);
    console.log(`[s3Ingestion:processS3File] Parsed ${rawRows.length} rows from CSV`);
    const filename = args.file_key.split("/").pop() ?? args.file_key;

    // Map product IDs to class IDs
    const mappedRows: {
      order_id: string;
      class_id?: string;
      customer_mobile: string;
      participant_count: number;
      unit_price: number;
      total_price: number;
      purchase_datetime: string;
    }[] = [];

    let skippedUnknownProduct = 0;
    for (const row of rawRows) {
      const class_id = resolveClassId(args.env, row.product_id);
      console.log(`[s3Ingestion:processS3File] Row: order_id=${row.order_id} product_id=${row.product_id} class_id=${class_id ?? 'NOT_FOUND'} phone=${row.user_phone} qty=${row.qty}`);
      if (!class_id) {
        console.warn(
          `[s3Ingestion] Unknown product_id "${row.product_id}" in file ${filename} — skipping row`
        );
        skippedUnknownProduct += 1;
        continue;
      }
      mappedRows.push({
        order_id: row.order_id,
        class_id,
        customer_mobile: row.user_phone,
        participant_count: row.qty,
        unit_price: row.unit_price,
        total_price: row.total,
        purchase_datetime: args.purchase_datetime,
      });
    }

    console.log(`[s3Ingestion:processS3File] Mapped ${mappedRows.length} rows, skipped ${skippedUnknownProduct} unknown products`);
    // Insert rows via mutation
    let insertResult = { rows_inserted: 0, rows_skipped: skippedUnknownProduct, purchase_ids: [] as string[] };
    if (mappedRows.length > 0) {
      const result = await ctx.runMutation(
        makeFunctionReference<"mutation">("s3IngestionMutations:applyS3CsvRows"),
        { rows: mappedRows }
      );
      insertResult = {
        rows_inserted: result.rows_inserted,
        rows_skipped: result.rows_skipped + skippedUnknownProduct,
        purchase_ids: result.purchase_ids as string[],
      };
    }

    console.log(`[s3Ingestion:processS3File] Insert complete. rows_inserted=${insertResult.rows_inserted} rows_skipped=${insertResult.rows_skipped}`);

    // Send WhatsApp term acceptance messages for newly inserted purchases (US-007)
    // Done here (in the action) so failures can be tracked per ingestion run (US-025)
    let whatsappErrors = 0;
    for (const purchase_id of insertResult.purchase_ids) {
      try {
        const sendResult = await ctx.runAction(
          makeFunctionReference<"action">(
            "purchaseConfirmation:sendPurchaseConfirmation"
          ),
          { purchase_id }
        );
        if (!sendResult.success) {
          whatsappErrors += 1;
          console.warn(`[s3Ingestion:processS3File] WhatsApp failed for purchase_id=${purchase_id}`);
        }
      } catch (err) {
        whatsappErrors += 1;
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[s3Ingestion:processS3File] WhatsApp error for purchase_id=${purchase_id}: ${msg}`);
      }
    }
    console.log(`[s3Ingestion:processS3File] WhatsApp sends complete. errors=${whatsappErrors}`);
    // Move file: copy to {ENV}/processed/, delete from {ENV}/new/ (US-006)
    const processedKey = `${args.env}/processed/${filename}`;
    console.log(`[s3Ingestion:processS3File] Moving file: ${args.file_key} → ${processedKey}`);
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: args.bucket,
          CopySource: `${args.bucket}/${args.file_key}`,
          Key: processedKey,
        })
      );
      await s3.send(
        new DeleteObjectCommand({ Bucket: args.bucket, Key: args.file_key })
      );
      console.log(`[s3Ingestion:processS3File] File moved successfully to ${processedKey}`);
    } catch (moveError) {
      const msg =
        moveError instanceof Error ? moveError.message : "Unknown move error";
      console.error(
        `[s3Ingestion] Failed to move ${args.file_key} → ${processedKey}: ${msg}`
      );
      // Continue — idempotency prevents duplicates on reprocessing
    }

    return {
      rows_inserted: insertResult.rows_inserted,
      rows_skipped: insertResult.rows_skipped,
      whatsapp_errors: whatsappErrors,
    };
  },
});

/**
 * Scheduled action: polls S3 for new CSV purchase files every 5 minutes.
 * On S3 error: logs full details and writes an error ingestion_run record (US-002).
 * Polling continues on next tick regardless of errors (US-002).
 */
export const pollS3ForNewFiles = actionGeneric({
  args: {},
  returns: v.object({
    files_found: v.number(),
    files_processed: v.number(),
    rows_inserted: v.number(),
    rows_skipped: v.number(),
    whatsapp_errors: v.number(),
  }),
  handler: async (ctx) => {
    const s3 = createS3Client();
    const bucket = getBucketName();
    const env = getAppEnv();
    const prefix = `${env}/new/`;

    // List objects in the {ENV}/new/ prefix
    let csvFiles: { key: string; filename: string }[] = [];
    try {
      const listResponse = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
      );
      csvFiles = (listResponse.Contents ?? [])
        .filter((obj) => obj.Key && obj.Key.endsWith(".csv"))
        .map((obj) => ({
          key: obj.Key!,
          filename: obj.Key!.split("/").pop() ?? obj.Key!,
        }));
    } catch (error) {
      // US-002: S3 error alerting — log full details and write error ingestion_run
      const errorMessage =
        error instanceof Error ? error.message : "Unknown S3 error";
      console.error(
        `[s3Ingestion] S3 ListObjectsV2 failed. ` +
        `error=${errorMessage} ` +
        `timestamp=${new Date().toISOString()} ` +
        `APP_ENV=${env}`
      );
      await ctx.runMutation(
        makeFunctionReference<"mutation">("s3IngestionMutations:recordIngestionRun"),
        {
          status: "error",
          files_processed: 0,
          rows_inserted: 0,
          rows_skipped: 0,
          error_message: errorMessage,
        }
      );
      // Return without throwing — polling continues on next tick
      return { files_found: 0, files_processed: 0, rows_inserted: 0, rows_skipped: 0, whatsapp_errors: 0 };
    }

    console.log(
      `[s3Ingestion] Polled S3. bucket=${bucket} prefix=${prefix} files_found=${csvFiles.length} keys=${JSON.stringify(csvFiles.map(f => f.key))}`
    );

    if (csvFiles.length === 0) {
      await ctx.runMutation(
        makeFunctionReference<"mutation">("s3IngestionMutations:recordIngestionRun"),
        {
          status: "success",
          files_processed: 0,
          rows_inserted: 0,
          rows_skipped: 0,
        }
      );
      return { files_found: 0, files_processed: 0, rows_inserted: 0, rows_skipped: 0, whatsapp_errors: 0 };
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalWhatsappErrors = 0;
    let filesProcessed = 0;
    let anyError = false;

    for (const obj of csvFiles) {
      try {
        const purchaseDatetime = parseDatetimeFromFilename(obj.filename);
        console.log(`[s3Ingestion] Processing file: key=${obj.key} filename=${obj.filename} purchase_datetime=${purchaseDatetime}`);
        const result = await ctx.runAction(
          makeFunctionReference<"action">("s3Ingestion:processS3File"),
          {
            file_key: obj.key,
            bucket,
            env,
            purchase_datetime: purchaseDatetime,
          }
        );
        totalInserted += result.rows_inserted;
        totalSkipped += result.rows_skipped;
        totalWhatsappErrors += result.whatsapp_errors;
        filesProcessed += 1;
      } catch (fileError) {
        anyError = true;
        const msg =
          fileError instanceof Error ? fileError.message : "Unknown error";
        console.error(`[s3Ingestion] Failed to process file ${obj.key}: ${msg} stack=${fileError instanceof Error ? fileError.stack : ''}`);
      }
    }

    const finalStatus =
      anyError && filesProcessed === 0
        ? "error"
        : anyError || totalSkipped > 0 || totalWhatsappErrors > 0
        ? "partial"
        : "success";

    await ctx.runMutation(
      makeFunctionReference<"mutation">("s3IngestionMutations:recordIngestionRun"),
      {
        status: finalStatus,
        files_processed: filesProcessed,
        rows_inserted: totalInserted,
        rows_skipped: totalSkipped,
        whatsapp_errors: totalWhatsappErrors > 0 ? totalWhatsappErrors : undefined,
        error_message: anyError ? "Some files failed to process" : undefined,
      }
    );

    return {
      files_found: csvFiles.length,
      files_processed: filesProcessed,
      rows_inserted: totalInserted,
      rows_skipped: totalSkipped,
      whatsapp_errors: totalWhatsappErrors,
    };
  },
});
