import { Charge, CronTask, Subscription } from "@prisma/client";
import { cron, cronTasks, ScheduledTask } from "./cron-registry";
import { MonoBankAPI } from "../apis/mono";
import { IS_DEV, TIMEZONE } from "../config";
import { getMerchantCronTasks } from "../db/cron-task.repository";
import { cancelSubscription } from "../db/transaction.repository";

export async function initializeCronTasksFromDB() {
  const merchants = await getMerchantCronTasks();
  for (const merchant of merchants) {
    const mono = new MonoBankAPI(merchant.shop, merchant.monobankToken, merchant.accessToken);
    for (const subscription of merchant.subscriptions) {
      for (const cronTask of subscription.cronTasks) {
        initializeCronTask(subscription,subscription.orderId,subscription.cardToken!, cronTask, mono);
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

export async function initializeCronTask(transaction: Subscription | Charge, orderId: string, cardToken: string, cronTask: CronTask, mono: MonoBankAPI): Promise<ScheduledTask> {
  const task = cron.schedule(
    cronTask.cronExpression,
    async () => {
      try {
        await mono.makePaymentByToken(transaction, orderId, cardToken);
      } catch (error) {
        console.error("Помилка при виконанні платежу:", error);
      }
    },
    { timezone: TIMEZONE }
  );

  cronTasks.set(cronTask.id, task);
  return task;
}

export async function reloadCronTask(transaction: Subscription | Charge, orderId: string, cardToken: string, cronTask: CronTask, mono: MonoBankAPI): Promise<ScheduledTask> {
  const oldTask = cronTasks.get(cronTask.id);
  if (oldTask) {
    oldTask.destroy();
    cronTasks.delete(cronTask.id);
  }
  return await initializeCronTask(transaction, orderId, cardToken, cronTask, mono);
}

export async function removeCronTask(id: string, transaction: Subscription): Promise<void> {
  const cronTask = cronTasks.get(id);
  if (cronTask) {
    cronTask.destroy();
    cronTasks.delete(id);
  }
  await cancelSubscription(transaction);
}

export function getCronTaskById(id: string): ScheduledTask | undefined {
  return cronTasks.get(id);
}
