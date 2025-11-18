"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shopify_controller_1 = require("../controllers/shopify.controller");
const router = (0, express_1.Router)();
// Для отримання токену вручну https://{shop}.myshopify.com/admin/oauth/authorize?client_id={}&scope={scopes}&redirect_uri={url}/auth/callback&state=authtext
// https://testshopfor1try.myshopify.com/admin/oauth/authorize?client_id=bbc113aea9d438586329ce99bec56866&scope=read_orders,write_orders,read_products,write_products&redirect_uri={}/auth/callback&state=authtext
router.get("/callback", shopify_controller_1.callback);
router.get("/get-gateway", shopify_controller_1.getGateway);
exports.default = router;
