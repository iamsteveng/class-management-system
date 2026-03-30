"use node";

import { actionGeneric } from "convex/server";
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
 * Scheduled action: polls S3 for new CSV purchase files.
 * Registered in crons.ts to run every 5 minutes.
 */
export const pollS3ForNewFiles = actionGeneric({
  args: {},
  returns: v.object({
    files_found: v.number(),
  }),
  handler: async (_ctx) => {
    const s3 = createS3Client();
    const bucket = getBucketName();
    const env = getAppEnv();
    const prefix = `${env}/new/`;

    const listResponse = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
    );

    const csvFiles = (listResponse.Contents ?? []).filter(
      (obj) => obj.Key && obj.Key.endsWith(".csv")
    );

    console.log(
      `[s3Ingestion] Polled S3. bucket=${bucket} prefix=${prefix} files_found=${csvFiles.length}`
    );

    return { files_found: csvFiles.length };
  },
});
