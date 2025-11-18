import { Request, Response } from "express";
import { MonoBankAPI } from "../apis/mono";
import { createCronTask, deleteCronTask } from "../db/cron-task.repository";
import { getMerchant } from "../db/merchant.repository";
import { deleteTransaction, getSubscriptionTransaction, saveTransaction } from "../db/transaction.repository";
import { initializeCronTask, reloadCronTask, removeCronTask } from "../functions/cron";

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
      await deleteTransaction(body.invoiceId);
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

      if (transaction.type === "subscription") {
        if (!transaction.cardToken) {
          res.status(200).json({ status: "no_card_token" });
          return;
        }

        const cronJob = await createCronTask(transaction);
        if (cronJob) {
          initializeCronTask(transaction, cronJob, mono);
          console.log("Створено task підписки для cron");
          res.status(200).json({ status: "success" });
          return;
        }
      }

      if (transaction.type === "charge") {
        const subscriptionTransaction = await getSubscriptionTransaction(shop, transaction.orderId);
        if (!subscriptionTransaction) {
          res.status(200).json({ status: "success", message: "success" });
          return;
        }

        transaction.cardToken = subscriptionTransaction.cardToken;

        const cronJob = await createCronTask(transaction, subscriptionTransaction.id);
        if (cronJob) {
          reloadCronTask(transaction, cronJob, mono);
          console.log("Оновлено task підписки для cron");
          res.status(200).json({ status: "success" });
          return;
        }
      }
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Помилка обробки колбеку:", error);
    res.status(200).json({ status: "error" });
  }
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

    const transaction = await getSubscriptionTransaction(shop, orderId);

    if (!transaction || !transaction?.cronTasks?.length) {
      console.log("Відсутня підписка або cron task");
      res.status(200).json({ status: "success" });
      return;
    }

    const cronTaskId = transaction.cronTasks[0].id;

    removeCronTask(cronTaskId, transaction);
    await deleteCronTask(cronTaskId);
    console.log("Відміна підписки");
    res.status(200).json({ status: "success" });
  } catch (error: any) {
    res.status(200).json({ status: "error" });
  }
};
