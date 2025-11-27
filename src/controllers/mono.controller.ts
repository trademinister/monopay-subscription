import { Request, Response } from "express";
import { MonoBankAPI } from "../apis/mono";
import { createCronTask, deleteCronTask } from "../db/cron-task.repository";
import { getMerchant } from "../db/merchant.repository";
import { deleteSubscription, getMerchantSubscriptions, getSubscriptionByCharge, getSubscriptionByOrderId, getSubscriptionChargesByInvoiceId, getSubscriptionChargesByOrderId, saveTransaction } from "../db/transaction.repository";
import { initializeCronTask, reloadCronTask, removeCronTask } from "../functions/cron";
import { Charge, Subscription } from "@prisma/client";

interface RequestParams {
  shop: string;
  orderId: string;
}

export const createSubscriptionUrl = async (req: Request<{}, any, any, RequestParams>, res: Response): Promise<void> => {
  try {
    const { shop, orderId } = req.query;
    console.log("Параметри запиту: ", shop, orderId);
    const merchant = await getMerchant(shop);
    if (!merchant) {
      res.status(200).json({ status: "error", message: "Merchant not found" });
      return;
    }
    const mono = new MonoBankAPI(merchant.shop, merchant.monobankToken!, merchant.accessToken);

    const response = await mono.createPaymentUrl(orderId);

    res.redirect(response.pageUrl);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const paymentCallBack = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as any;
    const shop = req.query.shop as string | undefined;
    const type = req.query.type as "subscription" | "charge";

    console.log("Параметри колбеку: ", shop, type);
    console.log("Тіло колбеку: ", body);

    if (!shop) {
      res.status(200).json({ status: "failed", message: "Відсутній магазин в параметрах запиту" });
      return;
    }

    const merchant = await getMerchant(shop);

    if (!merchant) {
      res.status(200).json({ status: "error", message: "Merchant not found" });
      return;
    }

    if (body?.status === "expired") {
      await deleteSubscription(body.invoiceId);
      console.log(`Транзакція видалена з БД — статус: "${body.status}"`);
      res.status(200).json({ status: "deleted" });
      return;
    }

    const transaction = await saveTransaction(body, merchant, type);
    console.log(`Транзакція(${type}) збережена`);

    if (transaction) {
      if (transaction.currentStatus !== "success") {
        res.status(200).json({ status: "pending" });
        return;
      }

      const mono = new MonoBankAPI(merchant.shop, merchant.monobankToken!, merchant.accessToken);

      if (type === "subscription") {
        const subscription = transaction as Subscription;
        if (!subscription.cardToken) {
          res.status(200).json({ status: "no_card_token" });
          return;
        }

        const cronJob = await createCronTask(subscription, "subscription");
        if (cronJob) {
          initializeCronTask(subscription, subscription.orderId, subscription.cardToken, cronJob, mono);
          console.log("Створено task підписки для cron");
          res.status(200).json({ status: "success" });
          return;
        }
      }

      if (type === "charge") {
        const charge = transaction as Charge;
        const subscription = await getSubscriptionByCharge(charge);
        if (!subscription) {
          res.status(200).json({ status: "success", message: "success" });
          return;
        }

        const cronJob = await createCronTask(charge, "charge", subscription.id);
        if (cronJob) {
          reloadCronTask(charge, subscription.orderId, subscription.cardToken!, cronJob, mono);
          console.log("Оновлено task підписки для cron");
          res.status(200).json({ status: "success" });
          return;
        }
      }
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Помилка обробки колбеку:", error);
    res.status(400).json({ status: "error" });
  }
};

export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
  const shop = req.query.shop as string | undefined;

  if (!shop) {
    res.status(404).json({ status: "error", message: "Shop not found" });
    return;
  }

  const subscriptions = (await getMerchantSubscriptions(shop))?.subscriptions;
  if (!subscriptions) {
    res.status(200).json([]);
    return;
  }
  res.status(200).json(subscriptions);
  return;
};

export const getSubscriptionCharges = async (req: Request, res: Response): Promise<void> => {
  const shop = req.query.shop as string | undefined;
  const invoiceId = req.query.invoiceId as string | undefined;
  const orderId = req.query.orderId as string | undefined;

  if (invoiceId) {
    const charges = await getSubscriptionChargesByInvoiceId(invoiceId);
    if (!charges) {
      res.status(200).json([]);
      return;
    }
    res.status(200).json(charges?.charges);
    return;
  }

  if (orderId) {
    const charges = (await getSubscriptionChargesByOrderId(shop!, orderId))?.subscriptions[0]?.charges;
    if (!charges) {
      res.status(400).json([]);
      return;
    }
    res.status(200).json(charges);
    return;
  }

  res.status(404).json({ status: "error", message: "Parameters orderId or invoiceId required" });
  return;
};

export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = req.query.shop as string;
    const orderId = req.query.orderId as string;
    console.log("Параметри запиту: ", shop, orderId);

    const merchant = getMerchant(shop);

    if (!merchant) {
      res.status(200).json({ status: "error", message: "Merchant not found" });
      return;
    }

    const subscription = await getSubscriptionByOrderId(shop, orderId);

    if (!subscription || !subscription?.cronTasks?.length) {
      console.log("Відсутня підписка або cron task");
      res.status(200).json({ status: "success" });
      return;
    }

    const cronTaskId = subscription.cronTasks[0].id;

    removeCronTask(cronTaskId, subscription);
    await deleteCronTask(cronTaskId);
    console.log("Відміна підписки");
    res.status(200).json({ status: "success" });
  } catch (error: any) {
    res.status(200).json({ status: "error" });
  }
};
