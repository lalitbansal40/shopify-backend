import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import constant from '../constants/constant'; // Assuming you have constants file (adjust if necessary)
import { loginSchema } from '../validation/auth.validation';

// The function to handle the login
export const loginCustomer = async (req: Request, res: Response) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }
    const { email, password } = req.body;
    const query = `
        mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
            customerAccessTokenCreate(input: $input) {
                customerAccessToken {
                    accessToken
                    expiresAt
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const variables = {
        input: { email, password }
    };

    try {
        // Send GraphQL request to Shopify
        const response = await axios.post(
            `https://${constant.SHOPIFY_DOMAIN}/api/${constant.STOREFRONT_API_VERSION}/graphql.json`,
            { query, variables },
            {
                headers: {
                    'X-Shopify-Storefront-Access-Token': constant.STOREFRONT_TOKEN,
                    'Content-Type': 'application/json',
                }
            }
        );

        const result = response.data.data.customerAccessTokenCreate;

        // Check if there are user errors
        if (result.userErrors.length > 0) {
            res.status(401).json({
                success: false,
                errors: result.userErrors
            });
            return
        }

        // Extract access token and expiration date
        const accessToken = result.customerAccessToken.accessToken;
        const expiresAt = result.customerAccessToken.expiresAt;

        // Create a payload for JWT
        const payload = {
            accessToken,
            expiresAt
        };

        // Sign the JWT with a secret key (stored in environment variables)
        const jwtToken = jwt.sign(payload, constant.JWT_SECRET, { expiresIn: '1h' }); // The token expires in 1 hour

        // Return the JWT token to the user
        res.status(200).json({
            success: true,
            data: { token: jwtToken }// The JWT token
        });
        return

    } catch (error: any) {
        console.error('Error logging in customer:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to authenticate customer' });
        return
    }
};
