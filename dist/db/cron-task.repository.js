"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerchantCronTasks = getMerchantCronTasks;
exports.createCronTask = createCronTask;
exports.deleteCronTask = deleteCronTask;
const prisma_1 = require("./prisma");
const cron_1 = require("../functions/cron");
async function getMerchantCronTasks() {
    return prisma_1.prisma.merchant.findMany({
        include: {
            subscriptions: {
                where: {
                    cancelled: false,
                    cardToken: { not: null },
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
async function createCronTask(transaction, transactionType, subscriptionTransactionId = null) {
    let modifiedDate = new Date(transaction.currentModified);
    const { updatedDate, newSchedule } = (0, cron_1.getNextDateForTask)(modifiedDate);
    if (transactionType === "subscription") {
        return await prisma_1.prisma.$transaction(async (tx) => {
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
    }
    else {
        return await prisma_1.prisma.$transaction(async (tx) => {
            return await tx.cronTask.update({
                where: { transactionId: subscriptionTransactionId },
                data: {
                    cronExpression: newSchedule,
                    nextRunDate: updatedDate,
                },
            });
        });
    }
}
async function deleteCronTask(id) {
    await prisma_1.prisma.cronTask.delete({ where: { id: id } });
}
