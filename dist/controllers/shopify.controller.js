"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGateway = exports.callback = void 0;
const shopify_functions_1 = require("../functions/shopify-functions");
const merchant_repository_1 = require("../db/merchant.repository");
const setup_1 = require("../scripts/setup");
const transaction_repository_1 = require("../db/transaction.repository");
const callback = async (req, res) => {
    try {
        const shop = req.query.shop;
        const code = req.query.code;
        const state = req.query.state;
        const json = Buffer.from(state, "base64").toString("utf-8");
        const { token, iv, tag } = JSON.parse(json);
        const monobankToken = await (0, setup_1.decrypt)(token, iv, tag, process.env.PASSWORD, process.env.SALT);
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
        const merchant = await (0, merchant_repository_1.createMerchant)(shop, data.access_token, monobankToken);
        const shopifyApi = new shopify_functions_1.ShopifyAPI(merchant.shop, merchant.accessToken);
        const metafieldDefinition = await shopifyApi.getMetafieldDefinition("uktzed", "copycon");
        if (!metafieldDefinition) {
            await shopifyApi.createMetafieldDefinition("Код УКТ ЗЕД", "uktzed");
        }
        res.status(200).send("App installed. Merchant created. Product variant metafields created.");
        return;
    }
    catch (error) {
        res.status(400).send(`An error occured: ${error}`);
        return;
    }
};
exports.callback = callback;
const getGateway = async (req, res) => {
    try {
        const shop = req.query.shop;
        const orderId = req.query.orderId;
        const merchant = await (0, merchant_repository_1.getMerchant)(shop);
        if (!merchant) {
            res.status(404).json({ status: "error", message: "Merchant not found" });
            return;
        }
        const shopifyApi = new shopify_functions_1.ShopifyAPI(merchant.shop, merchant.accessToken);
        const gateways = await shopifyApi.getOrderGateways(orderId);
        const subscription = await (0, transaction_repository_1.getOrderSubscriptionTransaction)(shop, orderId);
        res.json({ gateways, activity: subscription && !subscription.cancelled ? true : false, redirectUrl: subscription?.currentStatus === "created" ? `https://pay.monobank.ua/${subscription.invoiceId}` : "" });
        return;
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.getGateway = getGateway;
