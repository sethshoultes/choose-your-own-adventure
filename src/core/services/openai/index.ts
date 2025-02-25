/**
 * OpenAI Service Module Index
 * 
 * This module serves as the main entry point for OpenAI integration in the AdventureBuildr game engine.
 * It exports the OpenAIService and related types, configurations, and constants needed for
 * content generation and API interaction.
 * 
 * Key Features:
 * - Centralized OpenAI service exports
 * - Type definitions for API interactions
 * - Configuration settings and constants
 * - Model definitions and specifications
 * 
 * The module provides a clean interface for other components to interact with OpenAI services
 * while maintaining proper encapsulation of implementation details.
 * 
 * @module openai
 */

export { OpenAIService } from './OpenAIService';
export type * from './types';
export { defaultConfig, RATE_LIMIT, TIMEOUT_MS } from './config';
export { AVAILABLE_MODELS } from './models';

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    import { OpenAIService, defaultConfig } from '../services/openai';
 *    
 *    class GameEngine {
 *      private openai: OpenAIService;
 *      
 *      constructor() {
 *        this.openai = new OpenAIService(defaultConfig);
 *      }
 *      
 *      async generateScene() {
 *        // Use OpenAI service for content generation
 *      }
 *    }
 *    ```
 * 
 * 2. StoryService
 *    ```typescript
 *    import { OpenAIService, type OpenAIConfig } from '../services/openai';
 *    
 *    class StoryService {
 *      private openai: OpenAIService;
 *      
 *      constructor(config: Partial<OpenAIConfig>) {
 *        this.openai = new OpenAIService(config);
 *      }
 *    }
 *    ```
 * 
 * 3. Admin Test Panel
 *    ```typescript
 *    import { 
 *      OpenAIService, 
 *      AVAILABLE_MODELS,
 *      type OpenAIConfig 
 *    } from '../services/openai';
 *    
 *    function TestPanel() {
 *      const [config, setConfig] = useState<OpenAIConfig>({
 *        model: AVAILABLE_MODELS['gpt-4'].id,
 *        // Other config options
 *      });
 *    }
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Basic usage
 * import { OpenAIService } from '../services/openai';
 * 
 * const openai = new OpenAIService();
 * await openai.generateNextScene(prompt, callbacks);
 * 
 * // Custom configuration
 * import { OpenAIService, type OpenAIConfig } from '../services/openai';
 * 
 * const config: Partial<OpenAIConfig> = {
 *   model: 'gpt-4',
 *   temperature: 0.8
 * };
 * 
 * const openai = new OpenAIService(config);
 * 
 * // Using constants
 * import { TIMEOUT_MS, RATE_LIMIT } from '../services/openai';
 * 
 * console.log(`Timeout: ${TIMEOUT_MS}ms`);
 * console.log(`Rate limit: ${RATE_LIMIT.maxRequests} requests per ${RATE_LIMIT.windowMs}ms`);
 * ```
 * 
 * Error Handling:
 * ```typescript
 * import { OpenAIService } from '../services/openai';
 * 
 * try {
 *   const openai = new OpenAIService();
 *   await openai.generateNextScene(prompt, {
 *     onToken: handleToken,
 *     onComplete: handleComplete,
 *     onError: (error) => {
 *       console.error('OpenAI error:', error);
 *       // Handle specific error types
 *       if (error.code === 'TIMEOUT') {
 *         handleTimeout();
 *       } else if (error.code === 'RATE_LIMIT') {
 *         handleRateLimit();
 *       }
 *     }
 *   });
 * } catch (error) {
 *   // Handle unexpected errors
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always use proper error handling
 * 2. Configure appropriate timeouts
 * 3. Respect rate limits
 * 4. Use type definitions
 * 5. Monitor API usage
 * 
 * Module Structure:
 * ```
 * openai/
 * ├── index.ts           - Main entry point (this file)
 * ├── OpenAIService.ts   - Core service implementation
 * ├── OpenAIClient.ts    - API client implementation
 * ├── config.ts          - Configuration settings
 * ├── models.ts          - Model definitions
 * ├── types.ts           - Type definitions
 * └── RateLimiter.ts     - Rate limiting implementation
 * ```
 * 
 * @see OpenAIService for service implementation
 * @see config for configuration options
 * @see models for available models
 * @see types for type definitions
 */