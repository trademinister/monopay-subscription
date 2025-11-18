"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient({
    // log: ["query", "error", "warn"], // prod
    log: ["error", "warn"], // dev
});
process.on("beforeExit", async () => {
    await exports.prisma.$disconnect();
});
