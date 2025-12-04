/*
  Warnings:

  - Made the column `customerId` on table `subscription` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `subscription` MODIFY `customerId` VARCHAR(191) NOT NULL;
