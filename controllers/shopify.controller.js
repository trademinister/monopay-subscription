"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGateway = exports.callback = void 0;
const shopify_functions_1 = require("../functions/shopify-functions");
const callback = async (req, res) => {
    try {
        const { shop, code } = req.query;
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
        console.log("Access token:", data.access_token);
        const shopifyApi = new shopify_functions_1.ShopifyAPI(shop);
        const metafieldDefinition = await shopifyApi.getMetafieldDefinition("uktzed", "copycon");
        if (!metafieldDefinition) {
            await shopifyApi.createMetafieldDefinition("Код УКТ ЗЕД", "uktzed");
        }
        res.status(200).send("App installed. Token received. Product variant metafields created.");
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.callback = callback;
const getGateway = async (req, res) => {
    try {
        const { shop, orderId } = req.query;
        const shopifyApi = new shopify_functions_1.ShopifyAPI(shop);
        const gateways = await shopifyApi.getOrderGateways(orderId);
        res.json(gateways);
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.getGateway = getGateway;
