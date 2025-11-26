/*
  Warnings:

  - You are about to drop the column `active` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `active`,
    DROP COLUMN `type`,
    ADD COLUMN `cancelled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Charge` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `total` DECIMAL(18, 2) NOT NULL,
    `currency` INTEGER NOT NULL,
    `currentStatus` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL,
    `currentModified` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Charge_invoiceId_key`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Charge` ADD CONSTRAINT `Charge_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Transaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
