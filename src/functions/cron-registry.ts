import cron, { ScheduledTask } from "node-cron";

export const cronTasks = new Map<string, ScheduledTask>();
export { cron, ScheduledTask };
