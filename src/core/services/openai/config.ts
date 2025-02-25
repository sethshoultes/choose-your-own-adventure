/**
 * OpenAI Configuration Module
 * 
 * This module provides configuration settings for OpenAI integration in the AdventureBuildr game engine.
 * It defines default parameters, rate limiting settings, and timeout configurations for API interactions.
 * The configuration is used by the OpenAIService to manage API requests and ensure reliable content
 * generation.
 * 
 * Key Features:
 * - Model configuration presets
 * - Rate limiting parameters
 * - Request timeout settings
 * - Default generation parameters
 * 
 * @see OpenAIService for service implementation
 * @see models for available model configurations
 */

import type { OpenAIConfig } from './types';
import { AVAILABLE_MODELS } from './models';

/** Default model for content generation */
const DEFAULT_MODEL = 'gpt-4-turbo-preview';

/**
 * Default configuration for OpenAI requests
 * Used when no custom configuration is provided
 */
export const defaultConfig: OpenAIConfig = {
  ...AVAILABLE_MODELS[DEFAULT_MODEL],
  model: DEFAULT_MODEL,
};

/**
 * Rate limiting configuration
 * Prevents excessive API usage and ensures fair distribution
 */
export const RATE_LIMIT = {
  /** Maximum requests per time window */
  maxRequests: 3,
  /** Time window in milliseconds */
  windowMs: 60000, // 1 minute
};

/**
 * Request timeout in milliseconds
 * Prevents hanging requests and ensures responsiveness
 */
export const TIMEOUT_MS = 30000; // 30 seconds

/**
 * Integration Points:
 * 
 * 1. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    constructor(config: Partial<OpenAIConfig> = {}) {
 *      this.config = { ...defaultConfig, ...config };
 *      this.rateLimiter = new RateLimiter(RATE_LIMIT);
 *    }
 *    ```
 * 
 * 2. OpenAIClient
 *    ```typescript
 *    // In OpenAIClient
 *    public async streamCompletion(messages: any[], options: any): Promise<void> {
 *      const abortController = new AbortController();
 *      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);
 *      
 *      try {
 *        // Make API request with timeout
 *      } finally {
 *        clearTimeout(timeoutId);
 *      }
 *    }
 *    ```
 * 
 * 3. RateLimiter
 *    ```typescript
 *    // In RateLimiter
 *    export class RateLimiter {
 *      constructor() {
 *        this.maxRequests = RATE_LIMIT.maxRequests;
 *        this.windowMs = RATE_LIMIT.windowMs;
 *      }
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Custom configuration
 * const customConfig: Partial<OpenAIConfig> = {
 *   model: 'gpt-4',
 *   temperature: 0.8,
 *   maxTokens: 2000
 * };
 * 
 * const openai = new OpenAIService(customConfig);
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await openai.generateContent();
 * } catch (error) {
 *   if (error.code === 'TIMEOUT') {
 *     console.error(`Request timed out after ${TIMEOUT_MS}ms`);
 *   } else if (error.code === 'RATE_LIMIT') {
 *     console.error(`Rate limit exceeded: ${RATE_LIMIT.maxRequests} requests per ${RATE_LIMIT.windowMs}ms`);
 *   }
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always use rate limiting
 * 2. Set appropriate timeouts
 * 3. Handle API errors gracefully
 * 4. Monitor usage and costs
 * 5. Use appropriate model settings
 * 
 * @see OpenAIService for service implementation
 * @see RateLimiter for rate limiting logic
 * @see OpenAIClient for API interaction
 */