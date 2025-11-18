import "dotenv/config";
import readline from "readline";
import crypto from "crypto";

const algorithm = process.env.ALGORITHM!;
const ivLength = 12;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function encrypt(text: string, password: string, salt: string) {
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

export async function decrypt(encrypted: string, iv: string, tag: string, password: string, salt: string) {
  const key = await deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, "base64"));
  //@ts-ignore
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]);

  return decrypted.toString("utf8");
}

function input(question: string): Promise<string> {
  const rl = readline.createInterface({
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
    const { cipher, iv, tag } = await encrypt(monobankToken, process.env.PASSWORD!, process.env.SALT!);
    const state = Buffer.from(JSON.stringify({ token: cipher, iv, tag })).toString("base64");
    const url =
      `https://admin.shopify.com/store/${encodeURIComponent(shop)}/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=https://${process.env.DEV ? process.env.HOSTNAME_DEV : process.env.HOSTNAME_PROD}/auth/callback` +
      `&state=${encodeURIComponent(state)}`;

    console.log("\nГотове OAuth-посилання:\n");
    console.log(url);
  })();
}
