"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronTasksFromDB = initializeCronTasksFromDB;
exports.getNextDateForTask = getNextDateForTask;
exports.initializeCronTask = initializeCronTask;
exports.reloadCronTask = reloadCronTask;
exports.removeCronTask = removeCronTask;
exports.getCronTaskById = getCronTaskById;
const cron_registry_1 = require("./cron-registry");
const mono_1 = require("../apis/mono");
const config_1 = require("../config");
const cron_task_repository_1 = require("../db/cron-task.repository");
const transaction_repository_1 = require("../db/transaction.repository");
async function initializeCronTasksFromDB() {
    const merchants = await (0, cron_task_repository_1.getMerchantCronTasks)();
    for (const merchant of merchants) {
        const mono = new mono_1.MonoBankAPI(merchant.shop, merchant.monobankToken, merchant.accessToken);
        for (const subscription of merchant.subscriptions) {
            for (const cronTask of subscription.cronTasks) {
                initializeCronTask(subscription, subscription.orderId, subscription.cardToken, cronTask, mono);
            }
        }
    }
}
function getNextDateForTask(date) {
    const updatedDate = config_1.IS_DEV
        ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours() + 1, date.getUTCMinutes() + 2, date.getUTCSeconds(), date.getUTCMilliseconds()))
        : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
    const minute = updatedDate.getUTCMinutes();
    const hour = updatedDate.getUTCHours();
    const day = updatedDate.getUTCDate();
    const month = updatedDate.getUTCMonth() + 1;
    const newSchedule = `${minute} ${hour} ${day} ${month} *`;
    return { updatedDate, newSchedule };
}
async function initializeCronTask(transaction, orderId, cardToken, cronTask, mono) {
    const task = cron_registry_1.cron.schedule(cronTask.cronExpression, async () => {
        try {
            await mono.makePaymentByToken(transaction, orderId, cardToken);
        }
        catch (error) {
            console.error("Помилка при виконанні платежу:", error);
        }
    }, { timezone: config_1.TIMEZONE });
    cron_registry_1.cronTasks.set(cronTask.id, task);
    return task;
}
async function reloadCronTask(transaction, orderId, cardToken, cronTask, mono) {
    const oldTask = cron_registry_1.cronTasks.get(cronTask.id);
    if (oldTask) {
        oldTask.destroy();
        cron_registry_1.cronTasks.delete(cronTask.id);
    }
    return await initializeCronTask(transaction, orderId, cardToken, cronTask, mono);
}
async function removeCronTask(id, transaction) {
    const cronTask = cron_registry_1.cronTasks.get(id);
    if (cronTask) {
        cronTask.destroy();
        cron_registry_1.cronTasks.delete(id);
    }
    await (0, transaction_repository_1.cancelSubscription)(transaction);
}
function getCronTaskById(id) {
    return cron_registry_1.cronTasks.get(id);
}
