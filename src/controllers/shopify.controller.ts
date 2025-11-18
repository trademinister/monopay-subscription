import { Request, Response } from "express";
import { ShopifyAPI } from "../functions/shopify-functions";
import { createMerchant, getMerchant } from "../db/merchant.repository";
import { EncryptedPayload } from "../functions/types";
import { decrypt } from "../scripts/setup";
import { getOrderSubscriptionTransaction, getSubscriptionTransaction } from "../db/transaction.repository";

export const callback = async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = req.query.shop as string;
    const code = req.query.code as string;
    const state = req.query.state as string;

    const json = Buffer.from(state, "base64").toString("utf-8");
    const { token, iv, tag } = JSON.parse(json) as EncryptedPayload;

    const monobankToken = await decrypt(token, iv, tag, process.env.PASSWORD!, process.env.SALT!);

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });
    const data = await tokenResponse.json();

    const merchant = await createMerchant(shop, data.access_token, monobankToken);

    const shopifyApi = new ShopifyAPI(merchant.shop, merchant.accessToken);
    const metafieldDefinition = await shopifyApi.getMetafieldDefinition("uktzed", "copycon");

    if (!metafieldDefinition) {
      await shopifyApi.createMetafieldDefinition("Код УКТ ЗЕД", "uktzed");
    }

    res.status(200).send("App installed. Merchant created. Product variant metafields created.");
    return;
  } catch (error: any) {
    res.status(400).send(`An error occured: ${error}`);
    return;
  }
};

export const getGateway = async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = req.query.shop as string;
    const orderId = req.query.orderId as string;

    const merchant = await getMerchant(shop);

    if (!merchant) {
      res.status(404).json({ status: "error", message: "Merchant not found" });
      return;
    }

    const shopifyApi = new ShopifyAPI(merchant.shop, merchant.accessToken);
    const gateways = await shopifyApi.getOrderGateways(orderId as string);
    const subscription = await getOrderSubscriptionTransaction(shop, orderId);
    res.json({ gateways, activity: subscription && subscription.active ? true : false, redirectUrl: subscription?.currentStatus === "created" ? `https://pay.monobank.ua/${subscription.invoiceId}` : "" });
    return;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
