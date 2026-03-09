import { env } from '../../config/env';
import { CircuitBreaker } from '../../orchestration/resilience/circuitBreaker';
import { retryWithBackoff } from '../../orchestration/resilience/retry';
import { logger } from '../../utils/logger';

const circuitBreaker = new CircuitBreaker('syncmanager', env.CIRCUIT_BREAKER_THRESHOLD, env.CIRCUIT_BREAKER_TIMEOUT);

/**
 * Cliente API de SyncManager (CRM + WhatsApp IA).
 * REST API con API Key.
 */
export class SyncManagerClient {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = env.SYNCMANAGER_API_URL;
        this.apiKey = env.SYNCMANAGER_API_KEY;
    }

    private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
        return circuitBreaker.execute(async () => {
            return retryWithBackoff(async () => {
                const url = `${this.baseUrl}${endpoint}`;
                logger.debug(`SyncManager ${method} ${endpoint}`);

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: body ? JSON.stringify(body) : undefined,
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    const error: any = new Error(`SyncManager API error: ${response.status} ${errorBody}`);
                    error.status = response.status;
                    throw error;
                }

                return response.json() as Promise<T>;
            });
        });
    }

    // === Leads / Contactos ===
    async getLeads(params?: { status?: string; page?: number; limit?: number }) {
        const query = new URLSearchParams();
        if (params?.status) query.set('status', params.status);
        if (params?.page) query.set('page', params.page.toString());
        if (params?.limit) query.set('limit', params.limit.toString());
        const qs = query.toString() ? `?${query.toString()}` : '';
        return this.request<any>('GET', `/api/contacts${qs}`);
    }

    async getLead(id: string) {
        return this.request<any>('GET', `/api/contacts/${id}`);
    }

    async updateLead(id: string, data: any) {
        return this.request<any>('PUT', `/api/contacts/${id}`, data);
    }

    async addNote(contactId: string, text: string) {
        return this.request<any>('POST', `/api/contacts/${contactId}/notes`, { text });
    }

    // === Notificaciones ===
    async sendNotification(data: { contactId: string; message: string; channel: string }) {
        return this.request<any>('POST', '/api/notifications', data);
    }

    // === Estado de cliente ===
    async getClientStatus(id: string) {
        return this.request<any>('GET', `/api/contacts/${id}/status`);
    }

    async updateClientStatus(id: string, status: string, motivo?: string) {
        return this.request<any>('PUT', `/api/contacts/${id}/status`, { status, motivo });
    }

    // === Health Check ===
    async healthCheck(): Promise<boolean> {
        try {
            await this.request<any>('GET', '/api/health');
            return true;
        } catch {
            return false;
        }
    }

    getCircuitState(): string {
        return circuitBreaker.getState();
    }
}

export const syncManagerClient = new SyncManagerClient();
