import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Shopify OAuth Authorization
app.get('/auth', (req, res) => {
    const shop = `${process.env.HOST}`; // Replace with the shop domain
    const redirectUri = `${process.env.HOST}/auth/callback`; // Your callback URL
    const apiKey = process.env.SHOPIFY_API_KEY!;
    const scopes = 'read_products'; // Scopes you need
    const state = 'random_string'; // Generate a unique random string to prevent CSRF

    // Build the Shopify OAuth URL
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    // Redirect the user to the Shopify authorization page
    res.redirect(authUrl);
});

// Basic route to check if server is running
app.get('/', (_req, res) => {
    res.send('Hello, TypeScript + Express!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
