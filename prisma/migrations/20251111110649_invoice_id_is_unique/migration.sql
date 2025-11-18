/*
  Warnings:

  - A unique constraint covering the columns `[invoiceId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Transaction_invoiceId_key` ON `Transaction`(`invoiceId`);
