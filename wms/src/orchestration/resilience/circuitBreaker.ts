import { logger } from '../../utils/logger';

enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly name: string;
    private readonly threshold: number;
    private readonly timeout: number;

    constructor(name: string, threshold: number = 5, timeout: number = 60000) {
        this.name = name;
        this.threshold = threshold;
        this.timeout = timeout;
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = CircuitState.HALF_OPEN;
                logger.info(`Circuit breaker [${this.name}]: HALF_OPEN, probando reconexión`);
            } else {
                throw new Error(`Circuit breaker [${this.name}] está ABIERTO. Servicio no disponible temporalmente.`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            logger.info(`Circuit breaker [${this.name}]: CLOSED (reconexión exitosa)`);
        }
        this.failureCount = 0;
        this.state = CircuitState.CLOSED;
    }

    private onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.threshold) {
            this.state = CircuitState.OPEN;
            logger.error(`Circuit breaker [${this.name}]: OPEN tras ${this.failureCount} fallos consecutivos`);
        }
    }

    getState(): string {
        return this.state;
    }

    isAvailable(): boolean {
        if (this.state === CircuitState.CLOSED) return true;
        if (this.state === CircuitState.OPEN && Date.now() - this.lastFailureTime > this.timeout) return true;
        return false;
    }
}
