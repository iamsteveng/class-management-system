"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import {
  S3Client,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

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
  return process.env.S3_BUCKET_NAME ?? "mart-order-887306483832-ap-southeast-1-an";
}

function getAppEnv(): string {
  return process.env.APP_ENV ?? "dev";
}

/**
 * Mutation: records an ingestion run to the ingestion_runs table.
 */
export const recordIngestionRun = mutationGeneric({
  args: {
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("error")
    ),
    files_processed: v.number(),
    rows_inserted: v.number(),
    rows_skipped: v.number(),
    error_message: v.optional(v.string()),
  },
  returns: v.id("ingestion_runs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("ingestion_runs", {
      run_at: Date.now(),
      status: args.status,
      files_processed: args.files_processed,
      rows_inserted: args.rows_inserted,
      rows_skipped: args.rows_skipped,
      error_message: args.error_message,
    });
  },
});

/**
 * Scheduled action: polls S3 for new CSV purchase files.
 * Registered in crons.ts to run every 5 minutes.
 * Error alerting: on S3 failure, logs full details and writes an error ingestion_run record.
 * Polling continues on next tick regardless of errors (no crash).
 */
export const pollS3ForNewFiles = actionGeneric({
  args: {},
  returns: v.object({
    files_found: v.number(),
  }),
  handler: async (ctx) => {
    const s3 = createS3Client();
    const bucket = getBucketName();
    const env = getAppEnv();
    const prefix = `${env}/new/`;

    let csvFiles: { key: string }[] = [];
    try {
      const listResponse = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
      );

      csvFiles = (listResponse.Contents ?? [])
        .filter((obj) => obj.Key && obj.Key.endsWith(".csv"))
        .map((obj) => ({ key: obj.Key! }));
    } catch (error) {
      // US-002: S3 error alerting — log full details and write error ingestion run
      const errorMessage =
        error instanceof Error ? error.message : "Unknown S3 error";
      console.error(
        `[s3Ingestion] S3 ListObjectsV2 failed. ` +
        `error=${errorMessage} ` +
        `timestamp=${new Date().toISOString()} ` +
        `APP_ENV=${env}`
      );

      await ctx.runMutation(
        makeFunctionReference<"mutation">("s3Ingestion:recordIngestionRun"),
        {
          status: "error",
          files_processed: 0,
          rows_inserted: 0,
          rows_skipped: 0,
          error_message: errorMessage,
        }
      );

      // Return without throwing — polling continues on next tick
      return { files_found: 0 };
    }

    console.log(
      `[s3Ingestion] Polled S3. bucket=${bucket} prefix=${prefix} files_found=${csvFiles.length}`
    );

    // Write a success ingestion run (files will be counted properly in later stories)
    await ctx.runMutation(
      makeFunctionReference<"mutation">("s3Ingestion:recordIngestionRun"),
      {
        status: "success",
        files_processed: 0,
        rows_inserted: 0,
        rows_skipped: 0,
      }
    );

    return { files_found: csvFiles.length };
  },
});
