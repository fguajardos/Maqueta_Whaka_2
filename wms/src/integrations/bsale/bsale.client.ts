import { env } from '../../config/env';
import { CircuitBreaker } from '../../orchestration/resilience/circuitBreaker';
import { retryWithBackoff } from '../../orchestration/resilience/retry';
import { logger } from '../../utils/logger';

const circuitBreaker = new CircuitBreaker('bsale', env.CIRCUIT_BREAKER_THRESHOLD, env.CIRCUIT_BREAKER_TIMEOUT);

interface BSaleRequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    body?: any;
}

/**
 * Cliente API de BSale con circuit breaker y retry.
 * BSale usa REST API con Token Bearer.
 */
export class BSaleClient {
    private baseUrl: string;
    private token: string;

    constructor() {
        this.baseUrl = env.BSALE_API_URL;
        this.token = env.BSALE_ACCESS_TOKEN;
    }

    private async request<T>(options: BSaleRequestOptions): Promise<T> {
        return circuitBreaker.execute(async () => {
            return retryWithBackoff(async () => {
                const url = `${this.baseUrl}${options.endpoint}`;
                logger.debug(`BSale ${options.method} ${options.endpoint}`);

                const response = await fetch(url, {
                    method: options.method,
                    headers: {
                        'Content-Type': 'application/json',
                        access_token: this.token,
                    },
                    body: options.body ? JSON.stringify(options.body) : undefined,
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    const error: any = new Error(`BSale API error: ${response.status} ${errorBody}`);
                    error.status = response.status;
                    throw error;
                }

                return response.json() as Promise<T>;
            });
        });
    }

    // === Productos ===
    async getProducts(params?: { limit?: number; offset?: number }) {
        const query = params ? `?limit=${params.limit || 25}&offset=${params.offset || 0}` : '';
        return this.request<any>({ method: 'GET', endpoint: `/products.json${query}` });
    }

    async getProduct(id: string) {
        return this.request<any>({ method: 'GET', endpoint: `/products/${id}.json` });
    }

    async createProduct(data: any) {
        return this.request<any>({ method: 'POST', endpoint: '/products.json', body: data });
    }

    async updateProduct(id: string, data: any) {
        return this.request<any>({ method: 'PUT', endpoint: `/products/${id}.json`, body: data });
    }

    // === Documentos (Facturas/Boletas) ===
    async getDocuments(params?: { limit?: number; offset?: number }) {
        const query = params ? `?limit=${params.limit || 25}&offset=${params.offset || 0}` : '';
        return this.request<any>({ method: 'GET', endpoint: `/documents.json${query}` });
    }

    async createDocument(data: any) {
        return this.request<any>({ method: 'POST', endpoint: '/documents.json', body: data });
    }

    // === Clientes ===
    async getClients(params?: { limit?: number; offset?: number }) {
        const query = params ? `?limit=${params.limit || 25}&offset=${params.offset || 0}` : '';
        return this.request<any>({ method: 'GET', endpoint: `/clients.json${query}` });
    }

    async createClient(data: any) {
        return this.request<any>({ method: 'POST', endpoint: '/clients.json', body: data });
    }

    async updateClient(id: string, data: any) {
        return this.request<any>({ method: 'PUT', endpoint: `/clients/${id}.json`, body: data });
    }

    // === Stock ===
    async getStocks(params?: { limit?: number; offset?: number }) {
        const query = params ? `?limit=${params.limit || 25}&offset=${params.offset || 0}` : '';
        return this.request<any>({ method: 'GET', endpoint: `/stocks.json${query}` });
    }

    async updateStock(data: any) {
        return this.request<any>({ method: 'PUT', endpoint: '/stocks.json', body: data });
    }

    // === Health Check ===
    async healthCheck(): Promise<boolean> {
        try {
            await this.request<any>({ method: 'GET', endpoint: '/users/count.json' });
            return true;
        } catch {
            return false;
        }
    }

    getCircuitState(): string {
        return circuitBreaker.getState();
    }
}

export const bsaleClient = new BSaleClient();
