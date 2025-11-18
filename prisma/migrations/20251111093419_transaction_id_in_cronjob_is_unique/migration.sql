/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `CronJob` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `CronJob_transactionId_key` ON `CronJob`(`transactionId`);
