import { Router } from "express";
import { callback, getGateway } from "../controllers/shopify.controller";

const router = Router();

// Для отримання токену вручну потрібно запустити скрипт setup.ts й заповнити всі необхідні дані. Після отримати посилання та перейти по ньому. Створиться Merchant в БД з accessToken

router.get("/callback", callback);

router.get("/get-gateway", getGateway);

export default router;
