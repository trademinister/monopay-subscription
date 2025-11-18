"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mono_controller_1 = require("../controllers/mono.controller");
const router = (0, express_1.Router)();
router.get("/create-payment-url", mono_controller_1.createSubscriptionUrl);
router.post("/callback", mono_controller_1.paymentCallBack);
exports.default = router;
