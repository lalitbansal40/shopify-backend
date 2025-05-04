import { Request, Response } from 'express';
import axios from 'axios';
import constant from '../constants/constant';
import { IProductList } from '../interfaces/products.interface';

const getTotalProductCount = async (queryString: string): Promise<number> => {
    let count = 0;
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
        const response: any = await axios.post(
            `https://${constant.SHOPIFY_DOMAIN}/api/${constant.STOREFRONT_API_VERSION}/graphql.json`,
            {
                query: `
                query GetCount($query: String, $first: Int!, $after: String) {
                    products(first: $first, after: $after, query: $query) {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }`,
                variables: {
                    query: queryString || null,
                    first: 50,
                    after: cursor,
                },
            },
            {
                headers: {
                    'X-Shopify-Storefront-Access-Token': constant.STOREFRONT_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        const products = response.data.data.products;
        count += products.edges.length;
        hasNextPage = products.pageInfo.hasNextPage;
        cursor = products.pageInfo.endCursor;
    }

    return count;
};

// Controller: Get paginated products
export const getProductsList = async (req: Request, res: Response) => {
    const { search, page = 1, limit = 20 } = req.query;

    const queryString = search
        ? `(title:*${search}* OR description:*${search}* OR tag:*${search}*)`
        : '';

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skipItems = (pageNum - 1) * limitNum;

    // Helper: Get cursor to skip pages
    const getCursor = async (skip: number): Promise<string | null> => {
        let currentCursor: string | null = null;
        let remaining = skip;

        while (remaining > 0) {
            const chunk = Math.min(remaining, 50);

            const response: any = await axios.post(
                `https://${constant.SHOPIFY_DOMAIN}/api/${constant.STOREFRONT_API_VERSION}/graphql.json`,
                {
                    query: `
                    query GetCursor($query: String, $first: Int!, $after: String) {
                        products(first: $first, after: $after, query: $query) {
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                        }
                    }`,
                    variables: {
                        query: queryString || null,
                        first: chunk,
                        after: currentCursor,
                    },
                },
                {
                    headers: {
                        'X-Shopify-Storefront-Access-Token': constant.STOREFRONT_TOKEN,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const pageInfo = response.data.data.products.pageInfo;
            currentCursor = pageInfo.endCursor;
            remaining -= chunk;

            if (!pageInfo.hasNextPage && remaining > 0) return null;
        }

        return currentCursor;
    };

    try {
        const afterCursor = skipItems > 0 ? await getCursor(skipItems) : null;

        const response = await axios.post(
            `https://${constant.SHOPIFY_DOMAIN}/api/${constant.STOREFRONT_API_VERSION}/graphql.json`,
            {
                query: `
                query GetProducts($query: String, $first: Int!, $after: String) {
                    products(first: $first, after: $after, query: $query) {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        edges {
                            node {
                                id
                                title
                                handle
                                description
                                productType
                                tags
                                totalInventory
                                images(first: 1) {
                                    edges {
                                        node {
                                            src
                                            altText
                                        }
                                    }
                                }
                                variants(first: 50) {
                                    edges {
                                        node {
                                            id
                                            title
                                            availableForSale
                                            sku
                                            price {
                                                amount
                                                currencyCode
                                            }
                                            selectedOptions {
                                                name
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }`,
                variables: {
                    query: queryString || null,
                    first: limitNum,
                    after: afterCursor,
                },
            },
            {
                headers: {
                    'X-Shopify-Storefront-Access-Token': constant.STOREFRONT_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data.data.products;
        const products = data.edges.map((edge: any) => edge.node);

        const total = await getTotalProductCount(queryString);

        res.status(constant.STATUS_CODES.OK).json({
            success: true,
            data: products,
            pageInfo: data.pageInfo,
            currentPage: pageNum,
            limit: limitNum,
            total,
            hasNextPage: data.pageInfo.hasNextPage,
        });
    } catch (error: any) {
        console.error('Error fetching paginated products:', error?.response?.data || error.message);
        res.status(constant.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to fetch paginated products',
        });
    }
};


const getTotalCountInCollection = async (handle: string, searchQuery: string): Promise<number> => {
    let count = 0;
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
        const query = `
          query GetCount($handle: String!, $first: Int!, $after: String) {
            collectionByHandle(handle: $handle) {
              products(first: $first, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                edges {
                  node {
                    title
                    description
                    tags
                  }
                }
              }
            }
          }
        `;

        const response: any = await axios.post(
            `https://${constant.SHOPIFY_DOMAIN}/api/${constant.STOREFRONT_API_VERSION}/graphql.json`,
            {
                query,
                variables: {
                    handle,
                    first: 50,
                    after: cursor,
                },
            },
            {
                headers: {
                    'X-Shopify-Storefront-Access-Token': constant.STOREFRONT_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data.data.collectionByHandle?.products;
        if (!data) break;

        const filteredEdges = searchQuery
            ? data.edges.filter((edge: any) => {
                const { title, description, tags } = edge.node;
                const lowerSearch = searchQuery.toLowerCase();
                return (
                    title.toLowerCase().includes(lowerSearch) ||
                    description.toLowerCase().includes(lowerSearch) ||
                    tags.some((tag: string) => tag.toLowerCase().includes(lowerSearch))
                );
            })
            : data.edges;

        count += filteredEdges.length;
        hasNextPage = data.pageInfo.hasNextPage;
        cursor = data.pageInfo.endCursor;
    }

    return count;
};

export const getProductsListByCollection = async (req: Request, res: Response) => {
    const { collectionHandle } = req.params;
    const { search = '', page = 1, limit = 20 } = req.query;

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skipItems = (pageNum - 1) * limitNum;

    const query = `
      query GetProductsInCollection($handle: String!, $first: Int!, $after: String) {
        collectionByHandle(handle: $handle) {
          id
          title
          products(first: $first, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                title
                handle
                descriptionHtml
                productType
                tags
                totalInventory
                images(first: 1) {
                  edges {
                    node {
                      src
                      altText
                    }
                  }
                }
                variants(first: 20) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      sku
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Fetch cursor by skipping (used for pagination)
    const getCursorForPage = async (): Promise<string | null> => {
        let cursor: string | null = null;
        let remaining = skipItems;

        while (remaining > 0) {
            const chunk = Math.min(remaining, 50);

            const pageQuery = `
              query GetCursor($handle: String!, $first: Int!, $after: String) {
                collectionByHandle(handle: $handle) {
                  products(first: $first, after: $after) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                  }
                }
              }
            `;

            const response: any = await axios.post(
                `https://${constant.SHOPIFY_DOMAIN}/api/${constant.STOREFRONT_API_VERSION}/graphql.json`,
                {
                    query: pageQuery,
                    variables: {
                        handle: collectionHandle,
                        first: chunk,
                        after: cursor,
                    },
                },
                {
                    headers: {
                        'X-Shopify-Storefront-Access-Token': constant.STOREFRONT_TOKEN,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const pageInfo = response.data.data.collectionByHandle.products.pageInfo;
            cursor = pageInfo.endCursor;
            remaining -= chunk;

            if (!pageInfo.hasNextPage && remaining > 0) return null;
        }

        return cursor;
    };

    try {
        const afterCursor = skipItems > 0 ? await getCursorForPage() : null;

        const response = await axios.post(
            `https://${constant.SHOPIFY_DOMAIN}/api/${constant.STOREFRONT_API_VERSION}/graphql.json`,
            {
                query,
                variables: {
                    handle: collectionHandle,
                    first: limitNum,
                    after: afterCursor,
                },
            },
            {
                headers: {
                    'X-Shopify-Storefront-Access-Token': constant.STOREFRONT_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        const collection = response.data.data.collectionByHandle;
        const allEdges = collection.products.edges;

        // Filter by search
        const filteredProducts = allEdges
            .map((edge: any) => edge.node)
            .filter((product: any) => {
                const lowerSearch = String(search).toLowerCase();
                return (
                    product.title.toLowerCase().includes(lowerSearch) ||
                    product.descriptionHtml.toLowerCase().includes(lowerSearch) ||
                    product.tags.some((tag: string) => tag.toLowerCase().includes(lowerSearch))
                );
            });

        const total = await getTotalCountInCollection(collectionHandle, String(search));

        res.status(constant.STATUS_CODES.OK).json({
            success: true,
            data: filteredProducts,
            collectionId: collection.id,
            collectionTitle: collection.title,
            currentPage: pageNum,
            limit: limitNum,
            total,
            hasNextPage: collection.products.pageInfo.hasNextPage,
        });
    } catch (error: any) {
        console.error('Error fetching collection products:', error?.response?.data || error.message);
        res.status(constant.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch collection products' });
    }
};