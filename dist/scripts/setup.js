"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
require("dotenv/config");
const readline_1 = __importDefault(require("readline"));
const crypto = __importStar(require("crypto"));
const algorithm = process.env.ALGORITHM;
const ivLength = 12;
function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 32, (err, key) => {
            if (err)
                reject(err);
            else
                resolve(key);
        });
    });
}
async function encrypt(text, password, salt) {
    const key = await deriveKey(password, salt);
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    // @ts-ignore
    const authTag = cipher.getAuthTag();
    return {
        cipher: encrypted.toString("base64"),
        iv: iv.toString("base64"),
        tag: authTag.toString("base64"),
    };
}
async function decrypt(encrypted, iv, tag, password, salt) {
    const key = await deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, "base64"));
    //@ts-ignore
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]);
    return decrypted.toString("utf8");
}
function input(question) {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
if (require.main === module) {
    (async () => {
        console.log("Введіть дані для генерації OAuth-посилання:\n");
        let shop = await input("1. shop (наприклад testshop.myshopify.com або testshop): ");
        const clientId = await input("2. Shopify API key: ");
        const scopes = await input("3. scopes (через кому без пробілів): ");
        const monobankToken = await input("4. Токен монобанку: ");
        shop = shop.replace(".myshopify.com", "");
        const { cipher, iv, tag } = await encrypt(monobankToken, process.env.PASSWORD, process.env.SALT);
        const state = Buffer.from(JSON.stringify({ token: cipher, iv, tag })).toString("base64");
        const url = `https://admin.shopify.com/store/${encodeURIComponent(shop)}/oauth/authorize` +
            `?client_id=${encodeURIComponent(clientId)}` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&redirect_uri=https://${process.env.DEV ? process.env.HOSTNAME_DEV : process.env.HOSTNAME_PROD}/auth/callback` +
            `&state=${encodeURIComponent(state)}`;
        console.log("\nГотове OAuth-посилання:\n");
        console.log(url);
    })();
}
