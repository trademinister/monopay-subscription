"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.HOSTNAME = exports.TIMEZONE = exports.DATABASE = exports.IS_DEV = void 0;
exports.IS_DEV = process.env.DEV;
exports.DATABASE = exports.IS_DEV ? process.env.DATABASE_DEV_URL : process.env.DATABASE_PROD_URL;
exports.TIMEZONE = exports.IS_DEV ? process.env.TIMEZONE_DEV : process.env.TIMEZONE_PROD;
exports.HOSTNAME = exports.IS_DEV ? process.env.HOSTNAME_DEV : process.env.HOSTNAME_PROD;
exports.PORT = exports.IS_DEV ? process.env.PORT_DEV : process.env.PORT_PROD;
