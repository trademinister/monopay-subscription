"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shopify_controller_1 = require("../controllers/shopify.controller");
const router = (0, express_1.Router)();
// Для отримання токену вручну потрібно запустити скрипт setup.ts й заповнити всі необхідні дані. Після отримати посилання та перейти по ньому. Створиться Merchant в БД з accessToken
router.get("/callback", shopify_controller_1.callback);
router.get("/get-gateway", shopify_controller_1.getGateway);
exports.default = router;
