// src/shopify/shopify.config.ts
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    scopes: ['read_products'],
    hostName: process.env.HOST!.replace(/^https?:\/\//, ''),
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: true,
});

export default shopify;
