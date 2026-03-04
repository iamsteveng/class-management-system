import { actionGeneric, mutationGeneric, queryGeneric, makeFunctionReference } from "convex/server";
import { v, type GenericId } from "convex/values";

const REQUIRED_COLUMNS = [
  "order_id",
  "customer_mobile",
  "purchase_datetime",
  "participant_count",
] as const;

type ParsedCsvRecord = {
  order_id: string;
  customer_mobile: string;
  purchase_datetime: string;
  participant_count: number;
};

export const listPendingCsvFiles = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("csv_files"),
      filename: v.string(),
      file_storage_id: v.string(),
    })
  ),
  handler: async (ctx) => {
    const pendingFiles = await ctx.db
      .query("csv_files")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return pendingFiles.map((file) => ({
      _id: file._id,
      filename: file.filename,
      file_storage_id: file.file_storage_id,
    }));
  },
});

export const applyParsedCsvFile = mutationGeneric({
  args: {
    csv_file_id: v.id("csv_files"),
    rows: v.array(
      v.object({
        order_id: v.string(),
        customer_mobile: v.string(),
        purchase_datetime: v.string(),
        participant_count: v.number(),
      })
    ),
  },
  returns: v.object({
    inserted_count: v.number(),
    duplicate_count: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let insertedCount = 0;
    let duplicateCount = 0;

    for (const row of args.rows) {
      const existingPurchase = await ctx.db
        .query("purchases")
        .withIndex("by_order_id", (q) => q.eq("order_id", row.order_id))
        .first();

      if (existingPurchase) {
        duplicateCount += 1;
        await ctx.db.insert("audit_logs", {
          action: "csv_import_duplicate_order",
          entity_type: "purchase",
          entity_id: row.order_id,
          metadata: {
            csv_file_id: args.csv_file_id,
            reason: "Duplicate order_id skipped during CSV import",
          },
          created_at: now,
        });
        continue;
      }

      const purchaseId = await ctx.db.insert("purchases", {
        order_id: row.order_id,
        customer_mobile: row.customer_mobile,
        purchase_datetime: row.purchase_datetime,
        participant_count: row.participant_count,
        status: "pending_terms",
        token: crypto.randomUUID(),
        created_at: now,
      });

      await ctx.scheduler.runAfter(
        0,
        makeFunctionReference<"action">(
          "purchaseConfirmation:sendPurchaseConfirmation"
        ),
        {
          purchase_id: purchaseId,
        }
      );
      insertedCount += 1;
    }

    await ctx.db.patch(args.csv_file_id, {
      status: "processed",
      processed_at: now,
      error_message: undefined,
    });

    return {
      inserted_count: insertedCount,
      duplicate_count: duplicateCount,
    };
  },
});

export const markCsvFileFailed = mutationGeneric({
  args: {
    csv_file_id: v.id("csv_files"),
    error_message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.csv_file_id, {
      status: "failed",
      error_message: args.error_message,
      processed_at: Date.now(),
    });
    return null;
  },
});

export const processPendingCsvFiles = actionGeneric({
  args: {},
  returns: v.object({
    processed_files: v.number(),
    failed_files: v.number(),
  }),
  handler: async (ctx) => {
    const pendingFiles = await ctx.runQuery(
      makeFunctionReference<"query">("csvImport:listPendingCsvFiles"),
      {}
    );

    let processedFiles = 0;
    let failedFiles = 0;

    for (const file of pendingFiles) {
      try {
        const blob = await ctx.storage.get(
          file.file_storage_id as GenericId<"_storage">
        );
        if (!blob) {
          throw new Error(`Missing storage file for ${file.filename}`);
        }

        const csvText = await blob.text();
        const parsedRows = parseCsv(csvText);

        await ctx.runMutation(
          makeFunctionReference<"mutation">("csvImport:applyParsedCsvFile"),
          {
            csv_file_id: file._id,
            rows: parsedRows,
          }
        );

        processedFiles += 1;
      } catch (error) {
        failedFiles += 1;
        const message = error instanceof Error ? error.message : "Unknown CSV import error";
        await ctx.runMutation(
          makeFunctionReference<"mutation">("csvImport:markCsvFileFailed"),
          {
            csv_file_id: file._id,
            error_message: message,
          }
        );
      }
    }

    return {
      processed_files: processedFiles,
      failed_files: failedFiles,
    };
  },
});

function parseCsv(csvText: string): ParsedCsvRecord[] {
  const rows = splitCsvRows(csvText);
  if (rows.length === 0) {
    throw new Error("CSV is empty");
  }

  const header = rows[0].map((cell) => cell.trim());
  const columnIndex = getRequiredColumnIndexes(header);

  const parsedRows: ParsedCsvRecord[] = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (row.every((cell) => cell.trim() === "")) {
      continue;
    }

    const orderId = (row[columnIndex.order_id] ?? "").trim();
    const customerMobile = (row[columnIndex.customer_mobile] ?? "").trim();
    const purchaseDatetime = (row[columnIndex.purchase_datetime] ?? "").trim();
    const participantCountRaw = (row[columnIndex.participant_count] ?? "").trim();

    if (!orderId || !customerMobile || !purchaseDatetime || !participantCountRaw) {
      throw new Error(`Row ${rowIndex + 1} is missing required values`);
    }

    const participantCount = Number.parseInt(participantCountRaw, 10);
    if (!Number.isInteger(participantCount) || participantCount <= 0) {
      throw new Error(`Row ${rowIndex + 1} has invalid participant_count`);
    }

    parsedRows.push({
      order_id: orderId,
      customer_mobile: customerMobile,
      purchase_datetime: purchaseDatetime,
      participant_count: participantCount,
    });
  }

  return parsedRows;
}

function getRequiredColumnIndexes(header: string[]) {
  const indexes = {
    order_id: header.indexOf("order_id"),
    customer_mobile: header.indexOf("customer_mobile"),
    purchase_datetime: header.indexOf("purchase_datetime"),
    participant_count: header.indexOf("participant_count"),
  };

  for (const column of REQUIRED_COLUMNS) {
    if (indexes[column] === -1) {
      throw new Error(`CSV header missing required column: ${column}`);
    }
  }

  return indexes;
}

function splitCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];

    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      if (!(currentRow.length === 1 && currentRow[0].trim() === "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (!(currentRow.length === 1 && currentRow[0].trim() === "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}
