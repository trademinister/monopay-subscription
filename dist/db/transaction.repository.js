"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscription = getSubscription;
exports.getSubscriptionByCharge = getSubscriptionByCharge;
exports.getSubscriptionByOrderId = getSubscriptionByOrderId;
exports.getOrderSubscriptionTransaction = getOrderSubscriptionTransaction;
exports.getMerchantSubscriptions = getMerchantSubscriptions;
exports.getSubscriptionChargesByInvoiceId = getSubscriptionChargesByInvoiceId;
exports.getSubscriptionChargesByOrderId = getSubscriptionChargesByOrderId;
exports.saveTransaction = saveTransaction;
exports.cancelSubscription = cancelSubscription;
exports.deleteSubscription = deleteSubscription;
const client_1 = require("@prisma/client");
const prisma_1 = require("./prisma");
async function getSubscription(merchant) {
    return prisma_1.prisma.subscription.findMany({
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
async function getSubscriptionByCharge(charge) {
    return prisma_1.prisma.subscription.findUnique({
        where: { id: charge.subscriptionId },
        include: { cronTasks: true },
    });
}
async function getSubscriptionByOrderId(shop, orderId) {
    return await prisma_1.prisma.$transaction(async (tx) => {
        const merchant = await tx.merchant.findUnique({ where: { shop: shop } });
        return tx.subscription.findFirst({
            where: { merchantId: merchant.id, orderId: orderId, cancelled: false },
            include: { cronTasks: true },
        });
    });
}
async function getOrderSubscriptionTransaction(shop, orderId) {
    const transaction = prisma_1.prisma.$transaction(async (tx) => {
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
async function getMerchantSubscriptions(shop) {
    return await prisma_1.prisma.merchant.findUnique({
        where: { shop: shop },
        select: { shop: true, subscriptions: { select: { id: true, invoiceId: true, orderId: true, total: true, currency: true, currentStatus: true, currentModified: true, createdAt: true, updatedAt: true, cancelled: true } } },
    });
}
async function getSubscriptionChargesByInvoiceId(invoiceId) {
    return await prisma_1.prisma.subscription.findUnique({
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
async function getSubscriptionChargesByOrderId(shop, orderId) {
    return await prisma_1.prisma.$transaction(async (tx) => {
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
async function saveTransaction(transaction, merchant, transactionType) {
    const modified = new Date(transaction.modifiedDate);
    if (transactionType === "subscription") {
        return await prisma_1.prisma.$transaction(async (tx) => {
            let existing = await tx.subscription.findUnique({
                where: { invoiceId: transaction.invoiceId },
            });
            if (!existing) {
                existing = await tx.subscription.findFirst({ where: { orderId: transaction.reference, cancelled: true } });
            }
            let trx;
            if (transaction.status === "processing") {
                trx = existing;
            }
            else {
                if (!existing) {
                    trx = await tx.subscription.create({
                        data: {
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
                    }
                    else {
                        trx = existing;
                    }
                }
            }
            if (trx) {
                await tx.subscriptionStatus.upsert({
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
                    },
                });
            }
            return trx ?? null;
        }, { isolationLevel: "Serializable" });
    }
    else {
        return await prisma_1.prisma.$transaction(async (tx) => {
            const existing = await tx.charge.findUnique({
                where: { invoiceId: transaction.invoiceId },
            });
            let trx;
            if (transaction.status === "processing") {
                trx = existing;
            }
            else {
                if (!existing) {
                    const subscription = await tx.subscription.findFirst({ where: { orderId: transaction.reference, cancelled: false } });
                    trx = await tx.charge.create({
                        data: {
                            invoiceId: transaction.invoiceId,
                            total: new client_1.Prisma.Decimal(transaction.amount),
                            currency: Number(transaction.ccy),
                            currentStatus: transaction.status,
                            currentModified: modified,
                            subscription: { connect: { id: subscription.id } },
                        },
                    });
                }
                else {
                    if (existing.currentModified <= modified) {
                        trx = await tx.charge.update({
                            where: { id: existing.id },
                            data: {
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
                await tx.chargeStatus.upsert({
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
                    },
                });
            }
            return trx ?? null;
        }, { isolationLevel: "Serializable" });
    }
}
async function cancelSubscription(transaction) {
    await prisma_1.prisma.subscription.update({ where: { id: transaction.id }, data: { cancelled: true } });
}
async function deleteSubscription(invoiceId) {
    await prisma_1.prisma.$transaction(async (tx) => {
        const existed = await tx.subscription.findUnique({ where: { invoiceId: invoiceId } });
        if (existed) {
            await tx.subscription.delete({ where: { invoiceId: invoiceId } });
        }
    });
}
