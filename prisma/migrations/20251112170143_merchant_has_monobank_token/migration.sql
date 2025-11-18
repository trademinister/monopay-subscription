/*
  Warnings:

  - You are about to drop the `cronjob` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `monobankToken` to the `Merchant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cronjob` DROP FOREIGN KEY `CronJob_transactionId_fkey`;

-- AlterTable
ALTER TABLE `merchant` ADD COLUMN `monobankToken` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `cronjob`;

-- CreateTable
CREATE TABLE `CronTask` (
    `id` VARCHAR(191) NOT NULL,
    `cronExpression` VARCHAR(191) NOT NULL,
    `nextRunDate` DATETIME(3) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CronTask_transactionId_key`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CronTask` ADD CONSTRAINT `CronTask_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
