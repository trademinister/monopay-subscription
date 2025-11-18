"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronTask = initializeCronTask;
exports.reloadCronTask = reloadCronTask;
exports.getCronTaskById = getCronTaskById;
const cron_registry_1 = require("./cron-registry");
function initializeCronTask(shop, transaction, cronJob, mono) {
    // якщо вже є таск з таким id — спочатку приб’ємо
    const existing = cron_registry_1.cronTasks.get(cronJob.id);
    if (existing) {
        existing.destroy();
        cron_registry_1.cronTasks.delete(cronJob.id);
    }
    const task = cron_registry_1.cron.schedule(cronJob.cronExpression, async () => {
        try {
            await mono.makePaymentByToken(shop, transaction);
        }
        catch (error) {
            console.error("Помилка при виконанні платежу:", error);
        }
    }, { timezone: "Europe/Berlin" });
    // зберігаємо в реєстр під вашим id
    cron_registry_1.cronTasks.set(cronJob.id, task);
    console.log(`Cron task ${cronJob.id} створено.`);
    return task;
}
function reloadCronTask(shop, transaction, cronJob, mono) {
    const oldTask = cron_registry_1.cronTasks.get(cronJob.id);
    if (oldTask) {
        oldTask.destroy();
        cron_registry_1.cronTasks.delete(cronJob.id);
        console.log(`Старий cron task ${cronJob.id} знищено.`);
    }
    return initializeCronTask(shop, transaction, cronJob, mono);
}
function getCronTaskById(id) {
    return cron_registry_1.cronTasks.get(id);
}
