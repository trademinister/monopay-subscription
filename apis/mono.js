"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonoBankAPI = void 0;
const shopify_functions_1 = require("../functions/shopify-functions");
class MonoBankAPI {
    constructor() {
        this.baseUrl = "https://api.monobank.ua/api";
        this.token = process.env.MONOBANK_TOKEN_DEV;
    }
    getHeaders() {
        return {
            "Content-Type": "application/json",
            // "Accept": "application/json",
            "X-Token": this.token,
        };
    }
    async createPaymentUrl(shop, orderId) {
        try {
            const shopifyApi = new shopify_functions_1.ShopifyAPI(shop);
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
                redirectUrl: `https://${shop}`,
                webHookUrl: `https://clan-melissa-compressed-stay.trycloudflare.com/mono/callback?shop=${shop}&type=subscription`,
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
            const response = await fetch(`${this.baseUrl}/merchant/invoice/create`, { headers: headers, method: "POST", body: JSON.stringify(body) });
            const data = (await response.json());
            console.log("Виконано запит 'Створення рахунку'");
            // console.log("\n", data);
            // return {
            //   invoiceId: "p2_9ZgpZVsl3",
            //   pageUrl: "https://pay.mbnk.biz/p2_9ZgpZVsl3",
            // };
            return {
                invoiceId: data.invoiceId,
                pageUrl: data.pageUrl,
            };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async makePaymentByToken(shop, transaction) {
        try {
            const shopifyApi = new shopify_functions_1.ShopifyAPI(shop);
            const order = await shopifyApi.getShopifyOrder(transaction.orderId);
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
                cardToken: transaction.cardToken,
                amount: Number(transaction.total),
                ccy: transaction.currency,
                initiationKind: "merchant",
                merchantPaymInfo: {
                    reference: transaction.orderId,
                    basketOrder: basketOrder,
                },
                redirectUrl: `https://${shop}`,
                successUrl: `https://${shop}`,
                failUrl: `https://${shop}`,
                webHookUrl: `https://clan-melissa-compressed-stay.trycloudflare.com/mono/callback?shop=${shop}&type=charge`,
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
            // return {
            //   invoiceId: "p2_9ZgpZVsl3",
            //   pageUrl: "https://pay.mbnk.biz/p2_9ZgpZVsl3",
            // };
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.MonoBankAPI = MonoBankAPI;
