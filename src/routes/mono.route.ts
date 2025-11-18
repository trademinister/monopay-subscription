import { Router } from "express";
import { cancelSubscription, createSubscriptionUrl, paymentCallBack } from "../controllers/mono.controller";

const router = Router();

router.get("/create-payment-url", createSubscriptionUrl);

router.post("/callback", paymentCallBack);

router.post("/cancel-subscription", cancelSubscription)

export default router;
