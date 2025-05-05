export interface IShopifyCustomer {
    id: number;
    created_at: string;
    updated_at: string;
    orders_count: number;
    state: string;
    total_spent: string;
    last_order_id: number | null;
    note: string | null;
    verified_email: boolean;
    multipass_identifier: string | null;
    tax_exempt: boolean;
    tags: string;
    last_order_name: string | null;
    currency: string;
    addresses: any[]; // You can create a detailed type if address structure is known
    tax_exemptions: string[];
    email_marketing_consent: {
        state: 'subscribed' | 'not_subscribed';
        opt_in_level: 'single_opt_in' | 'confirmed_opt_in';
        consent_updated_at: string | null;
    };
    sms_marketing_consent: {
        state: 'subscribed' | 'not_subscribed';
        opt_in_level: 'single_opt_in' | 'confirmed_opt_in';
        consent_updated_at: string | null;
        consent_collected_from: 'CUSTOMER' | 'STORE_FRONT' | 'OTHER';
    };
    admin_graphql_api_id: string;
}
