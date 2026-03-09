import dotenv from 'dotenv';
dotenv.config();

export const env = {
    // Server
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database
    DATABASE_URL: process.env.DATABASE_URL || '',

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // BSale
    BSALE_API_URL: process.env.BSALE_API_URL || 'https://api.bsale.cl/v1',
    BSALE_ACCESS_TOKEN: process.env.BSALE_ACCESS_TOKEN || '',

    // Shopify
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || '',
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '',
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || '',
    SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN || '',
    SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION || '2024-10',
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET || '',

    // SyncManager
    SYNCMANAGER_API_URL: process.env.SYNCMANAGER_API_URL || '',
    SYNCMANAGER_API_KEY: process.env.SYNCMANAGER_API_KEY || '',
    SYNCMANAGER_WEBHOOK_SECRET: process.env.SYNCMANAGER_WEBHOOK_SECRET || '',

    // Resilience
    CIRCUIT_BREAKER_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    CIRCUIT_BREAKER_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10),
    RETRY_MAX_ATTEMPTS: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
    RETRY_INITIAL_DELAY: parseInt(process.env.RETRY_INITIAL_DELAY || '1000', 10),

    // Stock Sync
    STOCK_SYNC_INTERVAL: parseInt(process.env.STOCK_SYNC_INTERVAL || '15', 10),
};
