import type { Request } from "express";
import crypto from "crypto";
import { ShopifyProxyAuthResult } from "./types";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function computeHmac(message: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function buildMessage(query: Record<string, any>): string {
  const map: Record<string, string[]> = {};

  for (const key of Object.keys(query)) {
    if (key === "signature") continue;

    const value = query[key];
    if (Array.isArray(value)) {
      map[key] = value.map(String);
    } else {
      map[key] = [String(value)];
    }
  }

  const parts = Object.entries(map).map(([key, vals]) => {
    return `${key}=${vals.join(",")}`;
  });

  return parts.sort().join("");
}

// -----------------------------------------------------------------------------
// Основна валідація Shopify App Proxy
// -----------------------------------------------------------------------------

export function verifyShopifyProxyRequest(req: Request, secret: string): ShopifyProxyAuthResult {
  const signature = req.query.signature;
  if (!signature || typeof signature !== "string") {
    return { ok: false, reason: "missing_signature" };
  }

  // 1. HMAC перевірка
  const message = buildMessage(req.query as Record<string, any>);
  const expected = computeHmac(message, secret);

  const validSig = timingSafeEqual(signature, expected);

  if (!validSig) {
    return { ok: false, reason: "invalid_signature" };
  }

  // 2. Перевірка shop
  const shop = req.query.shop;
  if (!shop || typeof shop !== "string" || !shop.endsWith(".myshopify.com")) {
    return { ok: false, reason: "invalid_shop" };
  }

  // 3. Timestamp
  const tsRaw = req.query.timestamp;
  const ts = tsRaw ? Number(tsRaw) : NaN;

  if (!ts || Number.isNaN(ts)) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const now = Math.floor(Date.now() / 1000);
  const allowedSkew = 300; // 5 хвилин

  if (Math.abs(now - ts) > allowedSkew) {
    return { ok: false, reason: "timestamp_out_of_range" };
  }

  // 4. logged_in_customer_id (опційно)
  const customerIdRaw = req.query.logged_in_customer_id;
  const customerId = typeof customerIdRaw === "string" ? customerIdRaw : "";

  return {
    ok: true,
    shop,
    customerId,
    timestamp: ts,
  };
}
