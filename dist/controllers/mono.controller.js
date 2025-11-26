"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelSubscription = exports.getSubscriptionCharges = exports.getSubscriptions = exports.paymentCallBack = exports.createSubscriptionUrl = void 0;
const mono_1 = require("../apis/mono");
const cron_task_repository_1 = require("../db/cron-task.repository");
const merchant_repository_1 = require("../db/merchant.repository");
const transaction_repository_1 = require("../db/transaction.repository");
const cron_1 = require("../functions/cron");
const createSubscriptionUrl = async (req, res) => {
    try {
        const { shop, orderId } = req.query;
        console.log("Параметри запиту: ", shop, orderId);
        const merchant = await (0, merchant_repository_1.getMerchant)(shop);
        if (!merchant) {
            res.status(200).json({ status: "error", message: "Merchant not found" });
            return;
        }
        const mono = new mono_1.MonoBankAPI(merchant.shop, merchant.monobankToken, merchant.accessToken);
        const response = await mono.createPaymentUrl(orderId);
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
        const shop = req.query.shop;
        const type = req.query.type;
        console.log("Параметри колбеку: ", shop, type);
        console.log("Тіло колбеку: ", body);
        if (!shop) {
            res.status(200).json({ status: "failed", message: "Відсутній магазин в параметрах запиту" });
            return;
        }
        const merchant = await (0, merchant_repository_1.getMerchant)(shop);
        if (!merchant) {
            res.status(200).json({ status: "error", message: "Merchant not found" });
            return;
        }
        if (body?.status === "expired") {
            await (0, transaction_repository_1.deleteSubscription)(body.invoiceId);
            console.log(`Транзакція видалена з БД — статус: "${body.status}"`);
            res.status(200).json({ status: "deleted" });
            return;
        }
        const transaction = await (0, transaction_repository_1.saveTransaction)(body, merchant, type);
        console.log(`Транзакція(${type}) збережена`);
        if (transaction) {
            if (transaction.currentStatus !== "success") {
                res.status(200).json({ status: "pending" });
                return;
            }
            const mono = new mono_1.MonoBankAPI(merchant.shop, merchant.monobankToken, merchant.accessToken);
            if (type === "subscription") {
                const subscription = transaction;
                if (!subscription.cardToken) {
                    res.status(200).json({ status: "no_card_token" });
                    return;
                }
                const cronJob = await (0, cron_task_repository_1.createCronTask)(subscription, "subscription");
                if (cronJob) {
                    (0, cron_1.initializeCronTask)(subscription, subscription.orderId, subscription.cardToken, cronJob, mono);
                    console.log("Створено task підписки для cron");
                    res.status(200).json({ status: "success" });
                    return;
                }
            }
            if (type === "charge") {
                const charge = transaction;
                const subscription = await (0, transaction_repository_1.getSubscriptionByCharge)(charge);
                if (!subscription) {
                    res.status(200).json({ status: "success", message: "success" });
                    return;
                }
                const cronJob = await (0, cron_task_repository_1.createCronTask)(charge, "charge", subscription.id);
                if (cronJob) {
                    (0, cron_1.reloadCronTask)(charge, subscription.orderId, subscription.cardToken, cronJob, mono);
                    console.log("Оновлено task підписки для cron");
                    res.status(200).json({ status: "success" });
                    return;
                }
            }
        }
        res.status(200).json({ status: "success" });
    }
    catch (error) {
        console.error("Помилка обробки колбеку:", error);
        res.status(200).json({ status: "error" });
    }
};
exports.paymentCallBack = paymentCallBack;
const getSubscriptions = async (req, res) => {
    const shop = req.query.shop;
    if (!shop) {
        res.status(404).json({ status: "error", message: "Shop not found" });
        return;
    }
    const subscriptions = (await (0, transaction_repository_1.getMerchantSubscriptions)(shop))?.subscriptions;
    if (!subscriptions) {
        res.status(400).json([]);
        return;
    }
    res.status(200).json(subscriptions);
    return;
};
exports.getSubscriptions = getSubscriptions;
const getSubscriptionCharges = async (req, res) => {
    const shop = req.query.shop;
    const invoiceId = req.query.invoiceId;
    const orderId = req.query.orderId;
    if (invoiceId) {
        const charges = await (0, transaction_repository_1.getSubscriptionChargesByInvoiceId)(invoiceId);
        if (!charges) {
            res.status(400).json([]);
            return;
        }
        res.status(200).json(charges?.charges);
        return;
    }
    if (orderId) {
        const charges = (await (0, transaction_repository_1.getSubscriptionChargesByOrderId)(shop, orderId))?.subscriptions[0]?.charges;
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
exports.getSubscriptionCharges = getSubscriptionCharges;
const cancelSubscription = async (req, res) => {
    try {
        const shop = req.query.shop;
        const orderId = req.query.orderId;
        console.log("Параметри запиту: ", shop, orderId);
        const merchant = (0, merchant_repository_1.getMerchant)(shop);
        if (!merchant) {
            res.status(200).json({ status: "error", message: "Merchant not found" });
            return;
        }
        const subscription = await (0, transaction_repository_1.getSubscriptionByOrderId)(shop, orderId);
        if (!subscription || !subscription?.cronTasks?.length) {
            console.log("Відсутня підписка або cron task");
            res.status(200).json({ status: "success" });
            return;
        }
        const cronTaskId = subscription.cronTasks[0].id;
        (0, cron_1.removeCronTask)(cronTaskId, subscription);
        await (0, cron_task_repository_1.deleteCronTask)(cronTaskId);
        console.log("Відміна підписки");
        res.status(200).json({ status: "success" });
    }
    catch (error) {
        res.status(200).json({ status: "error" });
    }
};
exports.cancelSubscription = cancelSubscription;
