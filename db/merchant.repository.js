"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerchants = getMerchants;
exports.getMerchant = getMerchant;
const prisma_1 = require("./prisma");
async function getMerchants() {
    return await prisma_1.prisma.$transaction(async (tx) => {
        return await tx.merchant.findMany();
    });
}
async function getMerchant(shop) {
    return await prisma_1.prisma.$transaction(async (tx) => {
        return await tx.merchant.findUnique({ where: { shop: shop } });
    });
}
