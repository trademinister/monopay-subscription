import { CronTask, Transaction } from "@prisma/client";
import { prisma } from "./prisma";
import { getNextDateForTask } from "../functions/cron";
import { MerchantWithCronTasks } from "../functions/types";

export async function getMerchantCronTasks(): Promise<MerchantWithCronTasks[]> {
  return prisma.merchant.findMany({
    include: {
      transactions: {
        where: {
          cronTasks: {
            some: {},
          },
        },
        include: {
          cronTasks: true,
        },
      },
    },
  });
}

export async function createCronTask(transaction: Transaction, subscriptionTransactionId: string | null = null): Promise<CronTask | undefined> {
  let modifiedDate = new Date(transaction.currentModified);
  const { updatedDate, newSchedule } = getNextDateForTask(modifiedDate);

  if (transaction.type === "subscription") {
    return await prisma.$transaction(async (tx) => {
      return await tx.cronTask.upsert({
        where: {
          transactionId: transaction.id,
        },
        update: {
          cronExpression: newSchedule,
          nextRunDate: updatedDate,
        },
        create: {
          cronExpression: newSchedule,
          nextRunDate: updatedDate,
          transaction: { connect: { id: transaction.id } },
        },
      });
    });
  } else {
    return await prisma.$transaction(async (tx) => {
      return await tx.cronTask.update({
        where: { transactionId: subscriptionTransactionId as string },
        data: {
          cronExpression: newSchedule,
          nextRunDate: updatedDate,
        },
      });
    });
  }
}

export async function deleteCronTask(id: string) {
  await prisma.cronTask.delete({ where: { id: id } });
}
