import { createMetafieldDefinitionMutation, getMetafieldDefinitionQuery, getOrderGatewayQuery, getOrderQuery } from "./graphql";
import { MetafieldDefinition, Order, OrderGateways } from "./types";

export class ShopifyAPI {
  private accessToken: string;
  private basicUrl: string;
  private shopifyVersion: string;

  constructor(shopifyDomain: string, accessToken: string) {
    this.accessToken = accessToken;
    this.shopifyVersion = process.env.SHOPIFY_VERSION!;
    this.basicUrl = `https://${shopifyDomain}/admin/api/${this.shopifyVersion}/graphql.json`;
  }

  private async sendRequest(query: string, variables: object | any) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();

    try {
      const res: Response = await fetch(this.basicUrl, {
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
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("VARIABLES: ", variables);
        console.error(`Shopify Request Timeout for order ${variables?.id}`);
      } else {
        console.log("VARIABLES: ", variables);
        console.error(`Shopify API Error for order ${variables?.id}:`, error);
      }
      return null;
    }
  }

  async getMetafieldDefinition(key: string, namespace: string): Promise<MetafieldDefinition | null> {
    const data = await this.sendRequest(getMetafieldDefinitionQuery, {
      identifier: {
        key: key,
        namespace: namespace,
        ownerType: "PRODUCTVARIANT",
      },
    });

    return data.metafieldDefinition;
  }

  async createMetafieldDefinition(name: string, key: string): Promise<void> {
    const data = await this.sendRequest(createMetafieldDefinitionMutation, {
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

  async getShopifyOrder(orderId: string): Promise<Order> {
    const data = await this.sendRequest(getOrderQuery, {
      id: `gid://shopify/Order/${orderId}`,
    });

    return data.order;
  }

  async getOrderGateways(orderId: string): Promise<OrderGateways> {
    const data = await this.sendRequest(getOrderGatewayQuery, {
      id: `gid://shopify/Order/${orderId}`,
    });

    return data.order.paymentGatewayNames;
  }
}
