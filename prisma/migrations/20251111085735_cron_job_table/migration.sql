-- CreateTable
CREATE TABLE `CronJob` (
    `id` VARCHAR(191) NOT NULL,
    `cronExpression` VARCHAR(191) NOT NULL,
    `nextRunDate` DATETIME(3) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CronJob` ADD CONSTRAINT `CronJob_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
