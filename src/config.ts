export const IS_DEV = process.env.DEV;

export const DATABASE = IS_DEV ? process.env.DATABASE_DEV_URL : process.env.DATABASE_PROD_URL;
export const TIMEZONE = IS_DEV ? process.env.TIMEZONE_DEV : process.env.TIMEZONE_PROD;
export const HOSTNAME = IS_DEV ? process.env.HOSTNAME_DEV : process.env.HOSTNAME_PROD;
export const PORT = IS_DEV ? process.env.PORT_DEV : process.env.PORT_PROD
