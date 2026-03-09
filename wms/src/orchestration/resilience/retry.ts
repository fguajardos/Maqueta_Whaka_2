import { logger } from '../../utils/logger';

interface RetryOptions {
    maxAttempts: number;
    initialDelay: number;
    shouldRetry?: (error: any) => boolean;
}

const defaultOptions: RetryOptions = {
    maxAttempts: 3,
    initialDelay: 1000,
    shouldRetry: (error: any) => {
        // Solo reintentar en errores 5xx o timeout
        if (error?.status >= 500 || error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
            return true;
        }
        return false;
    },
};

/**
 * Retry con backoff exponencial: 1s, 4s, 16s
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const opts = { ...defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            if (attempt === opts.maxAttempts) {
                logger.error(`Retry fallido tras ${opts.maxAttempts} intentos`, {
                    error: error.message,
                });
                throw error;
            }

            if (opts.shouldRetry && !opts.shouldRetry(error)) {
                throw error;
            }

            const delay = opts.initialDelay * Math.pow(4, attempt - 1); // 1s, 4s, 16s
            logger.warn(`Reintento ${attempt}/${opts.maxAttempts} en ${delay}ms`, {
                error: error.message,
            });
            await sleep(delay);
        }
    }

    throw lastError;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
