/*
  Warnings:

  - You are about to drop the column `date` on the `transaction` table. All the data in the column will be lost.
  - You are about to alter the column `currency` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(3)`.
  - A unique constraint covering the columns `[invoiceId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currentModified` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentStatus` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `date`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `currentModified` DATETIME(3) NOT NULL,
    ADD COLUMN `currentStatus` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL,
    ADD COLUMN `invoiceId` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `total` DECIMAL(18, 2) NOT NULL,
    MODIFY `currency` CHAR(3) NOT NULL;

-- CreateTable
CREATE TABLE `TransactionStatus` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `status` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL,
    `modifiedDate` DATETIME(3) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payload` JSON NULL,

    INDEX `TransactionStatus_modifiedDate_idx`(`modifiedDate`),
    UNIQUE INDEX `TransactionStatus_transactionId_status_modifiedDate_key`(`transactionId`, `status`, `modifiedDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Transaction_invoiceId_key` ON `Transaction`(`invoiceId`);

-- AddForeignKey
ALTER TABLE `TransactionStatus` ADD CONSTRAINT `TransactionStatus_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
