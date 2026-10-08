import { cronJobs, makeFunctionReference } from "convex/server";

const crons = cronJobs();

// 00:05 Hong Kong time: open the Sessions that have just entered the Timetable's window.
crons.daily(
  "open timetable sessions",
  { hourUTC: 16, minuteUTC: 5 },
  makeFunctionReference<"mutation">("timetable:openSessions"),
  {}
);

export default crons;
