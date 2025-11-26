"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyAPI = void 0;
const graphql_1 = require("./graphql");
class ShopifyAPI {
    constructor(shopifyDomain, accessToken) {
        this.accessToken = accessToken;
        this.shopifyVersion = process.env.SHOPIFY_VERSION;
        this.basicUrl = `https://${shopifyDomain}/admin/api/${this.shopifyVersion}/graphql.json`;
    }
    async sendRequest(query, variables) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const start = Date.now();
        try {
            const res = await fetch(this.basicUrl, {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": this.accessToken,
                },
                body: JSON.stringify({ query, variables }),
            });
            clearTimeout(timeout);
            if (!res.ok) {
                console.log("VARIABLES: ", variables);
                console.error(`Shopify API responded with status ${res.status} for order ${variables?.id}`);
                return null;
            }
            const data = await res.json();
            if (!data || data.errors) {
                console.log("VARIABLES: ", variables);
                console.error(`Shopify API returned errors for order ${variables?.id}:`, data.errors);
                return null;
            }
            return data.data;
        }
        catch (error) {
            if (error.name === "AbortError") {
                console.log("VARIABLES: ", variables);
                console.error(`Shopify Request Timeout for order ${variables?.id}`);
            }
            else {
                console.log("VARIABLES: ", variables);
                console.error(`Shopify API Error for order ${variables?.id}:`, error);
            }
            return null;
        }
    }
    async getMetafieldDefinition(key, namespace) {
        const data = await this.sendRequest(graphql_1.getMetafieldDefinitionQuery, {
            identifier: {
                key: key,
                namespace: namespace,
                ownerType: "PRODUCTVARIANT",
            },
        });
        return data.metafieldDefinition;
    }
    async createMetafieldDefinition(name, key) {
        const data = await this.sendRequest(graphql_1.createMetafieldDefinitionMutation, {
            definition: {
                name: name,
                namespace: "copycon",
                key: key,
                description: "",
                type: "single_line_text_field",
                ownerType: "PRODUCTVARIANT",
            },
        });
    }
    async getShopifyOrder(orderId) {
        const data = await this.sendRequest(graphql_1.getOrderQuery, {
            id: `gid://shopify/Order/${orderId}`,
        });
        return data.order;
    }
    async getOrderGateways(orderId) {
        const data = await this.sendRequest(graphql_1.getOrderGatewayQuery, {
            id: `gid://shopify/Order/${orderId}`,
        });
        return data.order.paymentGatewayNames;
    }
}
exports.ShopifyAPI = ShopifyAPI;
