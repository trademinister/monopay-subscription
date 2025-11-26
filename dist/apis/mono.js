"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonoBankAPI = void 0;
const shopify_functions_1 = require("../functions/shopify-functions");
const config_1 = require("../config");
class MonoBankAPI {
    constructor(shop, token, accessToken) {
        this.baseUrl = "https://api.monobank.ua/api";
        this.shop = shop;
        this.token = token;
        this.accessToken = accessToken;
    }
    getHeaders() {
        return {
            "Content-Type": "application/json",
            // "Accept": "application/json",
            "X-Token": this.token,
        };
    }
    async createPaymentUrl(orderId) {
        try {
            const shopifyApi = new shopify_functions_1.ShopifyAPI(this.shop, this.accessToken);
            const order = await shopifyApi.getShopifyOrder(orderId);
            const headers = this.getHeaders();
            const basketOrder = order.lineItems.nodes.map((lineItem) => {
                const discounts = lineItem.discountAllocations.map((discount) => ({
                    type: "DISCOUNT",
                    mode: "VALUE",
                    value: Number(discount.allocatedAmountSet.presentmentMoney.amount) * 100,
                }));
                return {
                    name: lineItem.variant.displayName,
                    qty: lineItem.quantity,
                    sum: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100,
                    total: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100 * lineItem.quantity,
                    icon: lineItem.image.url,
                    unit: "шт.",
                    code: lineItem.variant.id.split("/").pop(),
                    barcode: lineItem.variant.barcode,
                    // header: null, // поки пропуск
                    // footer: null, // поки пропуск
                    tax: lineItem.taxLines.map((taxLine) => taxLine.ratePercentage),
                    uktzed: lineItem.variant.metafield.value,
                    discounts: discounts,
                };
            });
            const body = {
                amount: Number(order.totalPriceSet.presentmentMoney.amount) * 100,
                ccy: 980,
                merchantPaymInfo: {
                    reference: order.id.split("/").pop(),
                    basketOrder: basketOrder,
                },
                redirectUrl: `https://${this.shop}`,
                webHookUrl: `https://${config_1.HOSTNAME}/mono/callback?shop=${this.shop}&type=subscription`,
                validity: 3600,
                // validity: 60,
                paymentType: "debit",
                saveCardData: {
                    saveCard: true,
                    walletId: "69f780d841a0434aa535b08821f4822c",
                },
            };
            if (order.customer.defaultEmailAddress.emailAddress) {
                body.merchantPaymInfo.customerEmails = [order.customer.defaultEmailAddress.emailAddress];
            }
            if (Number(order.currentTotalDiscountsSet.presentmentMoney.amount) > 0) {
                body.merchantPaymInfo.discounts = [
                    {
                        type: "DISCOUNT",
                        mode: "VALUE",
                        value: Number(order.currentTotalDiscountsSet.presentmentMoney.amount) * 100,
                    },
                ];
            }
            const response = await fetch(`${this.baseUrl}/merchant/invoice/create`, { headers: headers, method: "POST", body: JSON.stringify(body) });
            const data = (await response.json());
            return {
                invoiceId: data.invoiceId,
                pageUrl: data.pageUrl,
            };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async makePaymentByToken(transaction, orderId, cardToken) {
        try {
            const shopifyApi = new shopify_functions_1.ShopifyAPI(this.shop, this.accessToken);
            const order = await shopifyApi.getShopifyOrder(orderId);
            const headers = this.getHeaders();
            const basketOrder = order.lineItems.nodes.map((lineItem) => {
                const discounts = lineItem.discountAllocations.map((discount) => ({
                    type: "DISCOUNT",
                    mode: "VALUE",
                    value: Number(discount.allocatedAmountSet.presentmentMoney.amount) * 100,
                }));
                return {
                    name: lineItem.variant.displayName,
                    qty: lineItem.quantity,
                    sum: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100,
                    total: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100 * lineItem.quantity,
                    icon: lineItem.image.url,
                    unit: "шт.",
                    code: lineItem.variant.id.split("/").pop(),
                    barcode: lineItem.variant.barcode,
                    // header: null, // поки пропуск
                    // footer: null, // поки пропуск
                    tax: lineItem.taxLines.map((taxLine) => taxLine.ratePercentage),
                    uktzed: lineItem.variant.metafield.value,
                    discounts: discounts,
                };
            });
            const body = {
                cardToken: cardToken,
                amount: Number(transaction.total),
                ccy: transaction.currency,
                initiationKind: "merchant",
                merchantPaymInfo: {
                    reference: orderId,
                    basketOrder: basketOrder,
                },
                redirectUrl: `https://${this.shop}`,
                successUrl: `https://${this.shop}`,
                failUrl: `https://${this.shop}`,
                webHookUrl: `https://${config_1.HOSTNAME}/mono/callback?shop=${this.shop}&type=charge`,
                validity: 3600,
                // validity: 60,
                paymentType: "debit",
                saveCardData: {
                    saveCard: true,
                    walletId: "69f780d841a0434aa535b08821f4822c",
                },
            };
            if (order.customer.defaultEmailAddress.emailAddress) {
                body.merchantPaymInfo.customerEmails = [order.customer.defaultEmailAddress.emailAddress];
            }
            if (Number(order.currentTotalDiscountsSet.presentmentMoney.amount) > 0) {
                body.merchantPaymInfo.discounts = [
                    {
                        type: "DISCOUNT",
                        mode: "VALUE",
                        value: Number(order.currentTotalDiscountsSet.presentmentMoney.amount) * 100,
                    },
                ];
            }
            // console.log("\nТІЛО ЗАПИТУ: ", JSON.stringify(body));
            const response = await fetch(`${this.baseUrl}/merchant/wallet/payment`, { headers: headers, method: "POST", body: JSON.stringify(body) });
            const data = (await response.json());
            if (data?.errCode) {
                console.log("Виникла помилка при виконанні запиту", data?.errCode, data?.errText);
                console.log("Тіло запиту: ", JSON.stringify(body));
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.MonoBankAPI = MonoBankAPI;
