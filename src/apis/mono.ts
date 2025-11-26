import { Charge, Merchant, Subscription } from "@prisma/client";
import { ShopifyAPI } from "../functions/shopify-functions";
import { Body, Discount } from "../functions/types";
import { HOSTNAME } from "../config";

export class MonoBankAPI {
  private baseUrl = "https://api.monobank.ua/api";
  private shop: string;
  private token: string;
  private accessToken: string;

  constructor(shop: string, token: string, accessToken: string) {
    this.shop = shop;
    this.token = token;
    this.accessToken = accessToken;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      // "Accept": "application/json",
      "X-Token": this.token,
    };
  }

  async createPaymentUrl(orderId: string) {
    try {
      const shopifyApi = new ShopifyAPI(this.shop, this.accessToken);

      const order = await shopifyApi.getShopifyOrder(orderId);

      const headers = this.getHeaders();
      const basketOrder = order.lineItems.nodes.map((lineItem) => {
        const discounts = lineItem.discountAllocations.map(
          (discount): Discount => ({
            type: "DISCOUNT",
            mode: "VALUE",
            value: Number(discount.allocatedAmountSet.presentmentMoney.amount) * 100,
          })
        );
        return {
          name: lineItem.variant.displayName,
          qty: lineItem.quantity,
          sum: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100,
          total: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100 * lineItem.quantity,
          icon: lineItem.image.url,
          unit: "шт.",
          code: lineItem.variant.id.split("/").pop()!,
          barcode: lineItem.variant.barcode,
          // header: null, // поки пропуск
          // footer: null, // поки пропуск
          tax: lineItem.taxLines.map((taxLine) => taxLine.ratePercentage),
          uktzed: lineItem.variant.metafield.value,
          discounts: discounts,
        };
      });

      const body: Body = {
        amount: Number(order.totalPriceSet.presentmentMoney.amount) * 100,
        ccy: 980,
        merchantPaymInfo: {
          reference: order.id.split("/").pop()!,
          basketOrder: basketOrder,
        },
        redirectUrl: `https://${this.shop}`,
        webHookUrl: `https://${HOSTNAME}/mono/callback?shop=${this.shop}&type=subscription`,
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
      const data = (await response.json()) as { invoiceId: string; pageUrl: string };
      return {
        invoiceId: data.invoiceId,
        pageUrl: data.pageUrl,
      };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async makePaymentByToken(transaction: Subscription | Charge, orderId: string, cardToken: string): Promise<void> {
    try {
      const shopifyApi = new ShopifyAPI(this.shop, this.accessToken);
      const order = await shopifyApi.getShopifyOrder(orderId);

      const headers = this.getHeaders();

      const basketOrder = order.lineItems.nodes.map((lineItem) => {
        const discounts = lineItem.discountAllocations.map(
          (discount): Discount => ({
            type: "DISCOUNT",
            mode: "VALUE",
            value: Number(discount.allocatedAmountSet.presentmentMoney.amount) * 100,
          })
        );
        return {
          name: lineItem.variant.displayName,
          qty: lineItem.quantity,
          sum: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100,
          total: Number(lineItem.discountedUnitPriceAfterAllDiscountsSet.presentmentMoney.amount) * 100 * lineItem.quantity,
          icon: lineItem.image.url,
          unit: "шт.",
          code: lineItem.variant.id.split("/").pop()!,
          barcode: lineItem.variant.barcode,
          // header: null, // поки пропуск
          // footer: null, // поки пропуск
          tax: lineItem.taxLines.map((taxLine) => taxLine.ratePercentage),
          uktzed: lineItem.variant.metafield.value,
          discounts: discounts,
        };
      });

      const body: Body = {
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
        webHookUrl: `https://${HOSTNAME}/mono/callback?shop=${this.shop}&type=charge`,
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
      const data = (await response.json()) as { invoiceId: string; pageUrl: string; errCode?: string; errText?: string };
      if (data?.errCode) {
        console.log("Виникла помилка при виконанні запиту", data?.errCode, data?.errText);
        console.log("Тіло запиту: ", JSON.stringify(body));
      }
    } catch (error) {
      console.log(error);
    }
  }
}
