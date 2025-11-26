import { $Enums, Charge, CronTask, Merchant, Prisma, Subscription } from "@prisma/client";
import { Transaction as TransactionData } from "../functions/types";
import { prisma } from "./prisma";

export async function getSubscription(merchant: Merchant): Promise<Subscription[]> {
  return prisma.subscription.findMany({
    where: {
      merchant: {
        id: merchant.id,
      },
      currentStatus: "success",
      cardToken: {
        not: null,
      },
    },
  });
}

export async function getSubscriptionByCharge(charge: Charge): Promise<(Subscription & { cronTasks: CronTask[] }) | null> {
  return prisma.subscription.findUnique({
    where: { id: charge.subscriptionId },
    include: { cronTasks: true },
  });
}
export async function getSubscriptionByOrderId(shop: string, orderId: string): Promise<(Subscription & { cronTasks: CronTask[] }) | null> {
  return await prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.findUnique({ where: { shop: shop } });
    return tx.subscription.findFirst({
      where: { merchantId: merchant!.id, orderId: orderId, cancelled: false },
      include: { cronTasks: true },
    });
  });
}

export async function getOrderSubscriptionTransaction(shop: string, orderId: string): Promise<(Subscription & { cronTasks: CronTask[] }) | null> {
  const transaction = prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.findUnique({ where: { shop: shop } });
    if (merchant) {
      return await tx.subscription.findFirst({
        where: {
          orderId: orderId,
          merchant: { id: merchant.id },
        },
        include: { cronTasks: true },
      });
    }
    return null;
  });
  return transaction;
}

export async function getMerchantSubscriptions(shop: string) {
  return await prisma.merchant.findUnique({
    where: { shop: shop },
    select: { shop: true, subscriptions: { select: { id: true, invoiceId: true, orderId: true, total: true, currency: true, currentStatus: true, currentModified: true, createdAt: true, updatedAt: true, cancelled: true } } },
  });
}

export async function getSubscriptionChargesByInvoiceId(invoiceId: string) {
  return await prisma.subscription.findUnique({
    where: { invoiceId: invoiceId },
    select: {
      charges: {
        select: {
          id: true,
          invoiceId: true,
          total: true,
          currency: true,
          currentStatus: true,
          currentModified: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function getSubscriptionChargesByOrderId(shop: string, orderId: string) {
  return await prisma.$transaction(async (tx) => {
    return await tx.merchant.findUnique({
      where: { shop },
      select: {
        subscriptions: {
          where: { orderId },
          select: {
            charges: {
              select: {
                id: true,
                invoiceId: true,
                total: true,
                currency: true,
                currentStatus: true,
                currentModified: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });
  });
}

export async function saveTransaction(transaction: TransactionData, merchant: Merchant, transactionType: $Enums.TransactionType): Promise<Subscription | Charge | null> {
  const modified = new Date(transaction.modifiedDate);
  if (transactionType === "subscription") {
    return await prisma.$transaction(
      async (tx) => {
        let existing = await tx.subscription.findUnique({
          where: { invoiceId: transaction.invoiceId },
        });
        if (!existing) {
          existing = await tx.subscription.findFirst({ where: { orderId: transaction.reference, cancelled: true } });
        }
        let trx;
        if (transaction.status === "processing") {
          trx = existing;
        } else {
          if (!existing) {
            trx = await tx.subscription.create({
              data: {
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
              trx = await tx.subscription.update({
                where: { id: existing.id },
                data: {
                  invoiceId: transaction.invoiceId,
                  cardToken: transaction?.walletData?.cardToken || null,
                  currentStatus: transaction.status,
                  currentModified: modified,
                  cancelled: false,
                },
              });
            } else {
              trx = existing;
            }
          }
        }

        if (trx) {
          await tx.subscriptionStatus.upsert({
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
            },
          });
        }
        return trx ?? null;
      },
      { isolationLevel: "Serializable" }
    );
  } else {
    return await prisma.$transaction(
      async (tx) => {
        const existing = await tx.charge.findUnique({
          where: { invoiceId: transaction.invoiceId },
        });
        let trx;
        if (transaction.status === "processing") {
          trx = existing;
        } else {
          if (!existing) {
            const subscription = await tx.subscription.findFirst({ where: { orderId: transaction.reference, cancelled: false } });
            trx = await tx.charge.create({
              data: {
                invoiceId: transaction.invoiceId,
                total: new Prisma.Decimal(transaction.amount),
                currency: Number(transaction.ccy),
                currentStatus: transaction.status,
                currentModified: modified,
                subscription: { connect: { id: subscription!.id } },
              },
            });
          } else {
            if (existing.currentModified <= modified) {
              trx = await tx.charge.update({
                where: { id: existing.id },
                data: {
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
          await tx.chargeStatus.upsert({
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
            },
          });
        }
        return trx ?? null;
      },
      { isolationLevel: "Serializable" }
    );
  }
}

export async function cancelSubscription(transaction: Subscription): Promise<void> {
  await prisma.subscription.update({ where: { id: transaction.id }, data: { cancelled: true } });
}

export async function deleteSubscription(invoiceId: string) {
  await prisma.$transaction(async (tx) => {
    const existed = await tx.subscription.findUnique({ where: { invoiceId: invoiceId } });
    if (existed) {
      await tx.subscription.delete({ where: { invoiceId: invoiceId } });
    }
  });
}
