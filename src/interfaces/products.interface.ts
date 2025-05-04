export interface IProductList {
    id: string;
    title: string;
    handle: string;
    description: string;
    productType: string;
    tags: string[];
    totalInventory: number;
    images: {
        edges: Array<{
            node: {
                src: string;
                altText: string | null;
            };
        }>;
    };
    variants: {
        edges: Array<{
            node: {
                id: string;
                title: string;
                availableForSale: boolean;
                sku: string;
                price: {
                    amount: string;
                    currencyCode: string;
                };
                selectedOptions: Array<{
                    name: string;
                    value: string;
                }>;
            };
        }>;
    };
}
