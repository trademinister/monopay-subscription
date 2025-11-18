/*
  Warnings:

  - A unique constraint covering the columns `[shop]` on the table `Merchant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `merchantId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `merchantId` VARCHAR(191) NOT NULL,
    MODIFY `currentStatus` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL;

-- AlterTable
ALTER TABLE `transactionstatus` MODIFY `status` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed', 'expired') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Merchant_shop_key` ON `Merchant`(`shop`);

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
