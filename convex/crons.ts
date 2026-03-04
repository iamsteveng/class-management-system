import { cronJobs, makeFunctionReference } from "convex/server";

const crons = cronJobs();

crons.interval(
  "process pending csv files",
  { minutes: 1 },
  makeFunctionReference<"action">("csvImport:processPendingCsvFiles"),
  {}
);

export default crons;
