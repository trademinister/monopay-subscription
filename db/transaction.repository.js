"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuccessfulTransactions = getSuccessfulTransactions;
exports.getSubscriptionTransaction = getSubscriptionTransaction;
exports.saveTransaction = saveTransaction;
exports.deleteTransaction = deleteTransaction;
const client_1 = require("@prisma/client");
const prisma_1 = require("./prisma");
async function getSuccessfulTransactions(merchant) {
    return prisma_1.prisma.transaction.findMany({
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
async function getSubscriptionTransaction(shop, orderId) {
    const transaction = prisma_1.prisma.$transaction(async (tx) => {
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
            });
        }
        return null;
    });
    return transaction;
}
async function saveTransaction(transaction, shop, transactionType) {
    return await prisma_1.prisma.$transaction(async (tx) => {
        const merchant = await tx.merchant.findUnique({ where: { shop } });
        if (!merchant) {
            throw new Error(`Merchant with shop="${shop}" не знайдено`);
        }
        const modified = new Date(transaction.modifiedDate);
        const existing = await tx.transaction.findUnique({
            where: { invoiceId: transaction.invoiceId },
        });
        let trx;
        if (transaction.status === "processing") {
            console.log("Транзакція зі статусом 'processing', пропускаємо блок з додаванням або оновленням");
            trx = existing;
            console.log("Транзакція зі статусом 'processing'", trx);
        }
        else {
            if (!existing) {
                trx = await tx.transaction.create({
                    data: {
                        type: transactionType,
                        invoiceId: transaction.invoiceId,
                        orderId: transaction.reference,
                        total: new client_1.Prisma.Decimal(transaction.amount),
                        currency: Number(transaction.ccy),
                        currentStatus: transaction.status,
                        currentModified: modified,
                        merchant: { connect: { id: merchant.id } },
                    },
                });
            }
            else {
                if (existing.currentModified <= modified) {
                    trx = await tx.transaction.update({
                        where: { id: existing.id },
                        data: {
                            cardToken: transaction?.walletData?.cardToken || null,
                            currentStatus: transaction.status,
                            currentModified: modified,
                        },
                    });
                }
                else {
                    trx = existing;
                }
            }
        }
        if (trx) {
            await tx.transactionStatus.upsert({
                where: {
                    transactionId_status_modifiedDate: {
                        transactionId: trx?.id,
                        status: transaction.status,
                        modifiedDate: modified,
                    },
                },
                update: {
                    payload: transaction,
                },
                create: {
                    transactionId: trx.id,
                    status: transaction.status,
                    modifiedDate: modified,
                    payload: transaction,
                    // receivedAt выставится по умолчанию now()
                },
            });
        }
        return trx ?? null;
    }, { isolationLevel: "Serializable" });
}
async function deleteTransaction(invoiceId, shop) {
    await prisma_1.prisma.$transaction(async (tx) => {
        const merchant = await tx.merchant.findUnique({ where: { shop: shop } });
        if (merchant) {
            const existed = await tx.transaction.findUnique({ where: { invoiceId: invoiceId } });
            if (existed) {
                await tx.transaction.delete({ where: { invoiceId: invoiceId } });
            }
        }
    });
}
