import { Router } from "express";
import { cancelSubscription, createSubscriptionUrl, getSubscriptionCharges, getSubscriptions, paymentCallBack } from "../controllers/mono.controller";

const router = Router();

router.get("/create-payment-url", createSubscriptionUrl);

router.post("/callback", paymentCallBack);

router.post("/cancel-subscription", cancelSubscription);

router.get("/get-subscriptions", getSubscriptions);

router.get("/get-subscription-charges", getSubscriptionCharges);

export default router;
