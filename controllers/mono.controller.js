"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentCallBack = exports.createSubscriptionUrl = void 0;
const mono_1 = require("../apis/mono");
const transaction_repository_1 = require("../db/transaction.repository");
const cronjob_repository_1 = require("../db/cronjob.repository");
const cron_1 = require("../functions/cron");
const createSubscriptionUrl = async (req, res) => {
    try {
        const { shop, orderId } = req.query;
        console.log("Параметри запиту: ", shop, orderId);
        const mono = new mono_1.MonoBankAPI();
        const response = await mono.createPaymentUrl(shop, orderId);
        res.redirect(response.pageUrl);
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.createSubscriptionUrl = createSubscriptionUrl;
const paymentCallBack = async (req, res) => {
    try {
        const body = req.body;
        const { shop, type } = req.query;
        console.log("Параметри колбеку: ", shop, type);
        console.log("Прийшов колбек: ", "\n", req.body);
        if (!shop) {
            res.status(200).json({ status: "failed", message: "Відсутній магазин в параметрах запиту" });
            return;
        }
        if (body.status !== "expired") {
            const transaction = await (0, transaction_repository_1.saveTransaction)(body, shop, type);
            console.log(`Транзакція(${type}) занесена до БД`);
            if (transaction) {
                if (transaction.currentStatus === "success" && transaction.cardToken) {
                    const mono = new mono_1.MonoBankAPI();
                    const cronJob = await (0, cronjob_repository_1.createCronJob)(shop, transaction);
                    (0, cron_1.initializeCronTask)(shop, transaction, cronJob, mono);
                }
                else if (transaction.currentStatus === "success" && transaction.type === "charge") {
                    const mono = new mono_1.MonoBankAPI();
                    const subscriptionTransaction = await (0, transaction_repository_1.getSubscriptionTransaction)(shop, transaction.orderId);
                    if (subscriptionTransaction) {
                        transaction.cardToken = subscriptionTransaction.cardToken;
                        const cronJob = await (0, cronjob_repository_1.createCronJob)(shop, transaction, subscriptionTransaction.id);
                        if (cronJob) {
                            (0, cron_1.reloadCronTask)(shop, transaction, cronJob, mono);
                        }
                    }
                }
            }
            console.log("Створено task підписки для cron");
        }
        else {
            await (0, transaction_repository_1.deleteTransaction)(body.invoiceId, shop);
            console.log(`Транзакція видалена з БД - статус транзакції: "${body.status}"`);
        }
        res.status(200).json({ status: "success" });
    }
    catch (error) {
        console.error("Помилка обробки колбеку:", error);
        res.status(200).json({ status: "success" });
    }
};
exports.paymentCallBack = paymentCallBack;
// export const collectPayment = async (): Promise<void> => {
//   try {
//     const mono = new MonoBankAPI();
//     const merchants = await getMerchants();
//     for (const merchant of merchants) {
//       const shopifyApi = new ShopifyAPI(merchant.shop);
//       const transactions = await getSuccessfulTransactions(merchant);
//       for (const transaction of transactions) {
//         const order = await shopifyApi.getShopifyOrder(transaction.orderId);
//         // await mono.makePaymentByToken(merchant.shop, transaction, order);
//         const cronJob = await createCronJob(transaction, merchant.shop);
//       }
//     }
//   } catch (error) {
//     console.log("error ", error);
//   }
// };
