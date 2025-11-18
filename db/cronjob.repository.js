"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCronJob = createCronJob;
const prisma_1 = require("./prisma");
const merchant_repository_1 = require("./merchant.repository");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
async function createCronJob(shop, transaction, subscriptionTransactionId = null) {
    const modifiedDate = new Date(transaction.currentModified);
    const nextMonthDate = (0, date_fns_1.addMonths)(modifiedDate, 1);
    const formattedUTC = (0, date_fns_tz_1.formatInTimeZone)(nextMonthDate, "UTC", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    // modifiedDate.setUTCHours(modifiedDate.getUTCHours() + 1);
    // modifiedDate.setUTCMinutes(modifiedDate.getUTCMinutes() + 2);
    // const minute = String(modifiedDate.getUTCMinutes()).padStart(2, "0");
    // const hour = String(modifiedDate.getUTCHours()).padStart(2, "0");
    // const dayOfMonth = String(modifiedDate.getUTCDate()).padStart(2, "0");
    // const month = String(modifiedDate.getUTCMonth() + 1).padStart(2, "0");
    const cronSchedule = `${minute} ${hour} ${dayOfMonth} ${month} *`;
    if (transaction.type === "subscription") {
        return await prisma_1.prisma.$transaction(async (tx) => {
            return await tx.cronJob.upsert({
                where: {
                    transactionId: transaction.id,
                },
                update: {
                    cronExpression: cronSchedule,
                    nextRunDate: modifiedDate,
                },
                create: {
                    cronExpression: cronSchedule,
                    nextRunDate: modifiedDate,
                    transaction: { connect: { id: transaction.id } },
                },
            });
        });
    }
    else {
        const merchant = await (0, merchant_repository_1.getMerchant)(shop);
        if (merchant) {
            return await prisma_1.prisma.$transaction(async (tx) => {
                return await tx.cronJob.update({
                    where: { transactionId: subscriptionTransactionId },
                    data: {
                        cronExpression: cronSchedule,
                        nextRunDate: modifiedDate,
                    },
                });
            });
        }
    }
}
