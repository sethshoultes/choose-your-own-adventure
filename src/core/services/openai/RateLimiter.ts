/**
 * RateLimiter Class
 * 
 * This class provides rate limiting functionality for OpenAI API requests in the AdventureBuildr game engine.
 * It ensures API usage stays within acceptable limits and implements exponential backoff for retries.
 * The rate limiter works alongside the OpenAIService to prevent API quota exhaustion and handle
 * rate limit errors gracefully.
 * 
 * Key Features:
 * - Request rate tracking
 * - Time window management
 * - Exponential backoff
 * - Retry delay calculation
 * - Error recovery
 * 
 * Data Flow:
 * 1. Request tracking initialization
 * 2. Rate limit checking
 * 3. Time window management
 * 4. Retry delay calculation
 * 5. Error handling and recovery
 * 
 * @see OpenAIService for service integration
 * @see config for rate limit settings
 */

import { RATE_LIMIT } from './config';

export class RateLimiter {
  /** Tracks request timestamps within the current window */
  private requestTimes: number[] = [];

  /**
   * Checks if the current request would exceed rate limits
   * Removes expired timestamps and validates request count
   * 
   * @throws Error if rate limit would be exceeded
   * 
   * @example
   * ```typescript
   * try {
   *   rateLimiter.checkRateLimit();
   *   await makeRequest();
   * } catch (error) {
   *   if (error.message.includes('Rate limit')) {
   *     handleRateLimit();
   *   }
   * }
   * ```
   */
  public checkRateLimit(): void {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      time => now - time < RATE_LIMIT.windowMs
    );

    if (this.requestTimes.length >= RATE_LIMIT.maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.requestTimes.push(now);
  }

  /**
   * Calculates retry delay using exponential backoff
   * Handles rate limit headers and error types
   * 
   * @param error Error from failed request
   * @param attempt Current retry attempt number
   * @returns Delay in milliseconds before next retry
   * 
   * @example
   * ```typescript
   * const delay = rateLimiter.calculateRetryDelay(error, attempt);
   * await new Promise(resolve => setTimeout(resolve, delay));
   * return retryRequest();
   * ```
   */
  public calculateRetryDelay(error: any, attempt: number): number {
    // For rate limits, use the retry-after header if available
    if (error.status === 429) {
      const retryAfter = parseInt(error.headers?.['retry-after'] || '0', 10);
      if (retryAfter > 0) {
        return retryAfter * 1000;
      }
    }
    
    // Otherwise use exponential backoff
    return 2000 * Math.pow(2, attempt - 1);
  }
}

/**
 * Integration Points:
 * 
 * 1. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    export class OpenAIService {
 *      private rateLimiter: RateLimiter;
 *      
 *      constructor() {
 *        this.rateLimiter = new RateLimiter();
 *      }
 *      
 *      public async generateNextScene(): Promise<void> {
 *        try {
 *          this.rateLimiter.checkRateLimit();
 *          await this.makeRequest();
 *        } catch (error) {
 *          if (error.status === 429) {
 *            const delay = this.rateLimiter.calculateRetryDelay(error, attempt);
 *            await this.handleRateLimit(delay);
 *          }
 *        }
 *      }
 *    }
 *    ```
 * 
 * 2. OpenAIClient
 *    ```typescript
 *    // In OpenAIClient
 *    export class OpenAIClient {
 *      private async makeRequest(attempt = 1): Promise<void> {
 *        try {
 *          await this.sendRequest();
 *        } catch (error) {
 *          if (error.status === 429 && attempt < maxRetries) {
 *            const delay = rateLimiter.calculateRetryDelay(error, attempt);
 *            await new Promise(resolve => setTimeout(resolve, delay));
 *            return this.makeRequest(attempt + 1);
 *          }
 *          throw error;
 *        }
 *      }
 *    }
 *    ```
 * 
 * 3. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    function TestPanel() {
 *      const handleTest = async () => {
 *        try {
 *          rateLimiter.checkRateLimit();
 *          await runTest();
 *        } catch (error) {
 *          if (error.message.includes('Rate limit')) {
 *            showRateLimitWarning();
 *          }
 *        }
 *      };
 *    }
 *    ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   rateLimiter.checkRateLimit();
 *   await makeRequest();
 * } catch (error) {
 *   if (error.message.includes('Rate limit')) {
 *     const delay = rateLimiter.calculateRetryDelay(error, attempt);
 *     await new Promise(resolve => setTimeout(resolve, delay));
 *     return retryRequest();
 *   }
 *   throw error;
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always check rate limits before requests
 * 2. Implement proper retry logic
 * 3. Use exponential backoff
 * 4. Handle rate limit headers
 * 5. Monitor request patterns
 * 
 * Performance Optimization:
 * ```typescript
 * // Batch requests to minimize rate limit impact
 * const batchRequests = async (requests: Request[]) => {
 *   const results = [];
 *   for (const request of requests) {
 *     try {
 *       rateLimiter.checkRateLimit();
 *       results.push(await makeRequest(request));
 *     } catch (error) {
 *       if (error.message.includes('Rate limit')) {
 *         await handleRateLimit();
 *         results.push(await makeRequest(request));
 *       }
 *     }
 *   }
 *   return results;
 * };
 * 
 * // Implement request queuing
 * class RequestQueue {
 *   private queue: Request[] = [];
 *   
 *   async processQueue() {
 *     while (this.queue.length > 0) {
 *       try {
 *         rateLimiter.checkRateLimit();
 *         const request = this.queue.shift();
 *         await processRequest(request);
 *       } catch (error) {
 *         if (error.message.includes('Rate limit')) {
 *           await this.handleRateLimit();
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 * 
 * Usage Monitoring:
 * ```typescript
 * // Track request patterns
 * const usageMetrics = {
 *   totalRequests: 0,
 *   rateLimitHits: 0,
 *   averageDelay: 0
 * };
 * 
 * const trackUsage = (delay: number) => {
 *   usageMetrics.totalRequests++;
 *   if (delay > 0) {
 *     usageMetrics.rateLimitHits++;
 *     usageMetrics.averageDelay = 
 *       (usageMetrics.averageDelay * (usageMetrics.rateLimitHits - 1) + delay) /
 *       usageMetrics.rateLimitHits;
 *   }
 * };
 * ```
 * 
 * @see OpenAIService for service integration
 * @see config for rate limit settings
 * @see OpenAIClient for request handling
 */