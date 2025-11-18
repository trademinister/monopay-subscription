/*
  Warnings:

  - You are about to alter the column `currency` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `Char(3)` to `Int`.
  - The values [expired] on the enum `TransactionStatus_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [expired] on the enum `TransactionStatus_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `transaction` MODIFY `currency` INTEGER NOT NULL,
    MODIFY `currentStatus` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed') NOT NULL;

-- AlterTable
ALTER TABLE `transactionstatus` MODIFY `status` ENUM('created', 'processing', 'hold', 'success', 'failure', 'reversed') NOT NULL;
