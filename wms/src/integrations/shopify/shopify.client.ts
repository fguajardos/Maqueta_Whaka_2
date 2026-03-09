import { env } from '../../config/env';
import { CircuitBreaker } from '../../orchestration/resilience/circuitBreaker';
import { retryWithBackoff } from '../../orchestration/resilience/retry';
import { logger } from '../../utils/logger';

const circuitBreaker = new CircuitBreaker('shopify', env.CIRCUIT_BREAKER_THRESHOLD, env.CIRCUIT_BREAKER_TIMEOUT);

/**
 * Cliente API de Shopify usando GraphQL Admin API.
 * La spec indica usar GraphQL en lugar de REST (deprecated).
 */
export class ShopifyClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION}/graphql.json`;
    this.token = env.SHOPIFY_ACCESS_TOKEN;
  }

  private async graphql<T>(query: string, variables?: any): Promise<T> {
    return circuitBreaker.execute(async () => {
      return retryWithBackoff(async () => {
        logger.debug('Shopify GraphQL request');

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': this.token,
          },
          body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const error: any = new Error(`Shopify API error: ${response.status} ${errorBody}`);
          error.status = response.status;
          throw error;
        }

        const data: any = await response.json();
        if (data.errors) {
          throw new Error(`Shopify GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        return data.data as T;
      });
    });
  }

  // REST endpoint for inventory (some operations still require REST)
  private async rest<T>(method: string, endpoint: string, body?: any): Promise<T> {
    return circuitBreaker.execute(async () => {
      return retryWithBackoff(async () => {
        const restUrl = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION}${endpoint}`;
        logger.debug(`Shopify REST ${method} ${endpoint}`);

        const response = await fetch(restUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': this.token,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const error: any = new Error(`Shopify REST error: ${response.status} ${errorBody}`);
          error.status = response.status;
          throw error;
        }

        return response.json() as Promise<T>;
      });
    });
  }

  // === Productos ===
  async getProducts(first: number = 25, cursor?: string) {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              descriptionHtml
              productType
              status
              variants(first: 10) {
                edges {
                  node {
                    id
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
            }
            cursor
          }
          pageInfo { hasNextPage }
        }
      }
    `;
    return this.graphql<any>(query, { first, after: cursor });
  }

  async createProduct(data: any) {
    const mutation = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product { id title }
          userErrors { field message }
        }
      }
    `;
    return this.graphql<any>(mutation, { input: data });
  }

  async updateProduct(id: string, data: any) {
    const mutation = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id title }
          userErrors { field message }
        }
      }
    `;
    return this.graphql<any>(mutation, { input: { id, ...data } });
  }

  // === Pedidos ===
  async getOrders(first: number = 25, cursor?: string) {
    const query = `
      query getOrders($first: Int!, $after: String) {
        orders(first: $first, after: $after) {
          edges {
            node {
              id
              name
              email
              totalPriceSet { shopMoney { amount currencyCode } }
              displayFulfillmentStatus
              displayFinancialStatus
              createdAt
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    variant { sku }
                    originalUnitPriceSet { shopMoney { amount } }
                  }
                }
              }
              shippingAddress { address1 city province country zip }
            }
            cursor
          }
          pageInfo { hasNextPage }
        }
      }
    `;
    return this.graphql<any>(query, { first, after: cursor });
  }

  async createOrder(data: any) {
    return this.rest<any>('POST', '/orders.json', { order: data });
  }

  // === Clientes ===
  async createCustomer(data: any) {
    const mutation = `
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { id email }
          userErrors { field message }
        }
      }
    `;
    return this.graphql<any>(mutation, { input: data });
  }

  // === Fulfillment ===
  async createFulfillment(orderId: string, trackingInfo?: any) {
    const mutation = `
      mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) {
          fulfillment { id status }
          userErrors { field message }
        }
      }
    `;
    return this.graphql<any>(mutation, {
      fulfillment: { orderId, trackingInfo },
    });
  }

  // === Inventario ===
  async getInventoryLevels(locationId: string) {
    const query = `
      query inventoryLevels($locationId: ID!) {
        location(id: $locationId) {
          inventoryLevels(first: 100) {
            edges {
              node {
                available
                item { id variant { sku } }
              }
            }
          }
        }
      }
    `;
    return this.graphql<any>(query, { locationId });
  }

  async adjustInventory(inventoryItemId: string, locationId: string, delta: number) {
    const mutation = `
      mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          userErrors { field message }
          inventoryAdjustmentGroup { reason }
        }
      }
    `;
    return this.graphql<any>(mutation, {
      input: {
        reason: 'correction',
        name: 'available',
        changes: [{ delta, inventoryItemId, locationId }],
      },
    });
  }

  // === Health Check ===
  async healthCheck(): Promise<boolean> {
    try {
      const query = `{ shop { name } }`;
      await this.graphql<any>(query);
      return true;
    } catch {
      return false;
    }
  }

  getCircuitState(): string {
    return circuitBreaker.getState();
  }
}

export const shopifyClient = new ShopifyClient();
