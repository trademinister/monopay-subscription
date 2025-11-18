import { CronTask, Transaction } from "@prisma/client";
import { cron, cronTasks, ScheduledTask } from "./cron-registry";
import { MonoBankAPI } from "../apis/mono";
import { IS_DEV, TIMEZONE } from "../config";
import { getMerchantCronTasks } from "../db/cron-task.repository";
import { setTransactionActivity } from "../db/transaction.repository";

export async function initializeCronTasksFromDB() {
  const merchants = await getMerchantCronTasks();
  for (const merchant of merchants) {
    const mono = new MonoBankAPI(merchant.shop, merchant.monobankToken, merchant.accessToken);
    for (const transaction of merchant.transactions) {
      for (const cronTask of transaction.cronTasks) {
        initializeCronTask(transaction, cronTask, mono);
      }
    }
  }
}

export function getNextDateForTask(date: Date) {
  const updatedDate = IS_DEV
    ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours() + 1, date.getUTCMinutes() + 2, date.getUTCSeconds(), date.getUTCMilliseconds()))
    : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));

  const minute = updatedDate.getUTCMinutes();
  const hour = updatedDate.getUTCHours();
  const day = updatedDate.getUTCDate();
  const month = updatedDate.getUTCMonth() + 1;

  const newSchedule = `${minute} ${hour} ${day} ${month} *`;
  return { updatedDate, newSchedule };
}

export async function initializeCronTask(transaction: Transaction, cronTask: CronTask, mono: MonoBankAPI): Promise<ScheduledTask> {
  const task = cron.schedule(
    cronTask.cronExpression,
    async () => {
      try {
        await mono.makePaymentByToken(transaction);
      } catch (error) {
        console.error("Помилка при виконанні платежу:", error);
      }
    },
    { timezone: TIMEZONE }
  );

  cronTasks.set(cronTask.id, task);
  if (transaction.type === "subscription") await setTransactionActivity(transaction, true);
  return task;
}

export async function reloadCronTask(transaction: Transaction, cronTask: CronTask, mono: MonoBankAPI): Promise<ScheduledTask> {
  const oldTask = cronTasks.get(cronTask.id);
  if (oldTask) {
    oldTask.destroy();
    cronTasks.delete(cronTask.id);
  }
  return await initializeCronTask(transaction, cronTask, mono);
}

export async function removeCronTask(id: string, transaction: Transaction): Promise<void> {
  const cronTask = cronTasks.get(id);
  if (cronTask) {
    cronTask.destroy();
    cronTasks.delete(id);
  }
  await setTransactionActivity(transaction, false);
}

export function getCronTaskById(id: string): ScheduledTask | undefined {
  return cronTasks.get(id);
}
