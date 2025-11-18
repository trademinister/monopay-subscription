import { $Enums, Merchant, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function createMerchant(shop: string, accessToken: string, monobankToken: string): Promise<Merchant> {
  return await prisma.merchant.upsert({ where: { shop: shop }, update: { accessToken, monobankToken }, create: { shop, accessToken, monobankToken } });
}

export async function getMerchants(): Promise<Merchant[]> {
  return await prisma.$transaction(async (tx) => {
    return await tx.merchant.findMany();
  });
}

export async function getMerchant(shop: string): Promise<Merchant | null> {
  return await prisma.$transaction(async (tx) => {
    return await tx.merchant.findUnique({ where: { shop: shop } });
  });
}
