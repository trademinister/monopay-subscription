/*
  Warnings:

  - Made the column `monobankToken` on table `merchant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `merchant` MODIFY `monobankToken` VARCHAR(191) NOT NULL;
