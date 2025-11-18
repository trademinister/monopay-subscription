import { $Enums, CronTask, Merchant, Prisma, Transaction } from "@prisma/client";
import { Transaction as TransactionData } from "../functions/types";
import { prisma } from "./prisma";

export async function getSuccessfulTransactions(merchant: Merchant): Promise<Transaction[]> {
  return prisma.transaction.findMany({
    where: {
      merchant: {
        id: merchant.id,
      },
      currentStatus: "success",
      cardToken: {
        not: null,
      },
      type: "subscription",
    },
  });
}

export async function getSubscriptionTransaction(shop: string, orderId: string): Promise<(Transaction & { cronTasks: CronTask[] }) | null> {
  const transaction = prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.findUnique({ where: { shop: shop } });
    if (merchant) {
      return await tx.transaction.findFirst({
        where: {
          orderId: orderId,
          merchant: { id: merchant.id },
          type: "subscription",
          currentStatus: "success",
          cardToken: { not: null },
        },
        include: { cronTasks: true },
      });
    }
    return null;
  });
  return transaction;
}

export async function getOrderSubscriptionTransaction(shop: string, orderId: string): Promise<(Transaction & { cronTasks: CronTask[] }) | null> {
  const transaction = prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.findUnique({ where: { shop: shop } });
    if (merchant) {
      return await tx.transaction.findFirst({
        where: {
          orderId: orderId,
          merchant: { id: merchant.id },
          type: "subscription",
        },
        include: { cronTasks: true },
      });
    }
    return null;
  });
  return transaction;
}

export async function saveTransaction(transaction: TransactionData, merchant: Merchant, transactionType: $Enums.TransactionType): Promise<Transaction | null> {
  const modified = new Date(transaction.modifiedDate);
  return await prisma.$transaction(
    async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { invoiceId: transaction.invoiceId },
      });
      let trx;
      if (transaction.status === "processing") {
        trx = existing;
      } else {
        if (!existing) {
          trx = await tx.transaction.create({
            data: {
              type: transactionType,
              invoiceId: transaction.invoiceId,
              orderId: transaction.reference,
              total: new Prisma.Decimal(transaction.amount),
              currency: Number(transaction.ccy),
              currentStatus: transaction.status,
              currentModified: modified,
              merchant: { connect: { id: merchant.id } },
            },
          });
        } else {
          if (existing.currentModified <= modified) {
            trx = await tx.transaction.update({
              where: { id: existing.id },
              data: {
                cardToken: transaction?.walletData?.cardToken || null,
                currentStatus: transaction.status,
                currentModified: modified,
              },
            });
          } else {
            trx = existing;
          }
        }
      }

      if (trx) {
        await tx.transactionStatus.upsert({
          where: {
            transactionId_status_modifiedDate: {
              transactionId: trx?.id,
              status: transaction.status as $Enums.TxStatus,
              modifiedDate: modified,
            },
          },
          update: {
            payload: transaction as unknown as Prisma.InputJsonValue,
          },
          create: {
            transactionId: trx.id,
            status: transaction.status as $Enums.TxStatus,
            modifiedDate: modified,
            payload: transaction as unknown as Prisma.InputJsonValue,
            // receivedAt выставится по умолчанию now()
          },
        });
      }
      return trx ?? null;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function setTransactionActivity(transaction: Transaction, activity: boolean): Promise<void> {
  await prisma.transaction.update({ where: { id: transaction.id }, data: { active: activity } });
}

export async function deleteTransaction(invoiceId: string) {
  await prisma.$transaction(async (tx) => {
    const existed = await tx.transaction.findUnique({ where: { invoiceId: invoiceId } });
    if (existed) {
      await tx.transaction.delete({ where: { invoiceId: invoiceId } });
    }
  });
}
