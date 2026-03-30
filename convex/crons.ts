import { cronJobs, makeFunctionReference } from "convex/server";

const crons = cronJobs();

crons.interval(
  "process pending csv files",
  { minutes: 1 },
  makeFunctionReference<"action">("csvImport:processPendingCsvFiles"),
  {}
);

crons.interval(
  "poll S3 for new purchase CSV files",
  { minutes: 5 },
  makeFunctionReference<"action">("s3Ingestion:pollS3ForNewFiles"),
  {}
);

export default crons;
