/*
  Warnings:

  - You are about to drop the `transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactionstatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `charge` DROP FOREIGN KEY `Charge_subscriptionId_fkey`;

-- DropForeignKey
ALTER TABLE `crontask` DROP FOREIGN KEY `CronTask_transactionId_fkey`;

-- DropForeignKey
ALTER TABLE `transaction` DROP FOREIGN KEY `Transaction_merchantId_fkey`;

-- DropForeignKey
ALTER TABLE `transactionstatus` DROP FOREIGN KEY `TransactionStatus_transactionId_fkey`;

-- DropIndex
DROP INDEX `Charge_subscriptionId_fkey` ON `charge`;

-- DropTable
DROP TABLE `transaction`;

-- DropTable
DROP TABLE `transactionstatus`;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `total` DECIMAL(18, 2) NOT NULL,
    `currency` INTEGER NOT NULL,
    `currentStatus` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL,
    `currentModified` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cardToken` VARCHAR(191) NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `cancelled` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Subscription_invoiceId_key`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionStatus` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `status` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL,
    `modifiedDate` DATETIME(3) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payload` JSON NULL,

    INDEX `SubscriptionStatus_modifiedDate_idx`(`modifiedDate`),
    UNIQUE INDEX `SubscriptionStatus_transactionId_status_modifiedDate_key`(`transactionId`, `status`, `modifiedDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChargeStatus` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `status` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL,
    `modifiedDate` DATETIME(3) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payload` JSON NULL,

    INDEX `ChargeStatus_modifiedDate_idx`(`modifiedDate`),
    UNIQUE INDEX `ChargeStatus_transactionId_status_modifiedDate_key`(`transactionId`, `status`, `modifiedDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Charge` ADD CONSTRAINT `Charge_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubscriptionStatus` ADD CONSTRAINT `SubscriptionStatus_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChargeStatus` ADD CONSTRAINT `ChargeStatus_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Charge`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CronTask` ADD CONSTRAINT `CronTask_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
