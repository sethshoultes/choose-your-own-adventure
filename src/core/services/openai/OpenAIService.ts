/**
 * OpenAIService Class
 * 
 * This service provides high-level OpenAI integration for the AdventureBuildr game engine.
 * It manages content generation, streaming responses, and error handling while abstracting
 * the complexities of API interaction. The service works alongside the auto-save system
 * to ensure reliable story progression.
 * 
 * Key Features:
 * - Dynamic scene generation
 * - Streaming response handling
 * - Rate limiting
 * - Error recovery
 * - State management
 * 
 * Data Flow:
 * 1. Story prompt preparation
 * 2. API request configuration
 * 3. Response streaming and parsing
 * 4. Scene generation and validation
 * 5. State updates and persistence
 * 
 * @see OpenAIClient for low-level API interaction
 * @see RateLimiter for request throttling
 * @see GameEngine for integration
 */

import { defaultConfig } from './config';
import { OpenAIClient } from './OpenAIClient';
import { ResponseParser } from './ResponseParser';
import { RateLimiter } from './RateLimiter';
import { generateSystemPrompt, generateUserPrompt } from './prompts';
import { debugManager } from '../../debug/DebugManager';
import type { 
  OpenAIConfig,
  OpenAIStreamCallbacks,
  StoryPrompt
} from './types';

export class OpenAIService {
  /** Service configuration */
  private config: OpenAIConfig;
  /** API client instance */
  private client: OpenAIClient;
  /** Response parser instance */
  private parser: ResponseParser;
  /** Rate limiter instance */
  private rateLimiter: RateLimiter;
  /** Maximum retry attempts */
  private maxRetries = 3;

  /**
   * Creates a new OpenAI service instance
   * 
   * @param config Optional service configuration
   */
  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.client = new OpenAIClient();
    this.parser = new ResponseParser();
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Generates the next scene based on the story prompt
   * Handles streaming responses and error recovery
   * 
   * @param prompt Story generation prompt
   * @param callbacks Streaming callbacks
   * @throws Error if generation fails
   * 
   * @example
   * ```typescript
   * await openai.generateNextScene({
   *   context: {
   *     genre: 'Fantasy',
   *     character: currentCharacter,
   *     currentScene: activeScene,
   *     history: gameHistory
   *   },
   *   choice: selectedChoice
   * }, {
   *   onToken: updateScene,
   *   onComplete: finalizeScene,
   *   onError: handleError
   * });
   * ```
   */
  public async generateNextScene(
    prompt: StoryPrompt,
    callbacks: OpenAIStreamCallbacks
  ): Promise<void> {
    let buffer = '';

    try {
      this.rateLimiter.checkRateLimit();
      
      // Validate the prompt
      if (!prompt.context || !prompt.choice) {
        throw new Error('Invalid prompt: Missing required fields');
      }

      // Truncate history to reduce token usage
      prompt.context.history = prompt.context.history.slice(-5);

      await this.client.streamCompletion(
        [
          {
            role: 'system',
            content: generateSystemPrompt(prompt.context.genre),
          },
          {
            role: 'user',
            content: generateUserPrompt(prompt),
          },
        ],
        {
          model: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          presencePenalty: this.config.presencePenalty,
          frequencyPenalty: this.config.frequencyPenalty
        },
        {
          onToken: (token) => {
            buffer += token;
            callbacks.onToken(token);
            
            // Try to parse complete response
            try {
              const parsed = this.parser.parseResponse(buffer);
              if (parsed) {
                // Only complete if we have valid choices
                if (parsed.choices.length > 0 && !parsed.choices[0].text.includes('Investigate further')) {
                debugManager.log('Parsed response', 'success', { parsed });
                callbacks.onComplete(parsed.choices);
                return;
                }
              }
            } catch {
              // Not a complete response yet, continue
            }
          },
          onError: (error) => {
            debugManager.log('Stream error occurred', 'error', { error });
            callbacks.onError(error);
          }
        }
      );

      // Final parse attempt if no complete response was found
      if (buffer) {
        try {
          const parsed = this.parser.parseResponse(buffer);
          if (parsed && parsed.choices.length > 0 && !parsed.choices[0].text.includes('Investigate further')) {
            debugManager.log('Final parse successful', 'success', { parsed });
            callbacks.onComplete(parsed.choices);
          } else {
            const cleaned = this.parser.cleanResponse(buffer);
            callbacks.onToken(cleaned);
            callbacks.onComplete([
              { id: 1, text: 'Investigate further' },
              { id: 2, text: 'Take action' },
              { id: 3, text: 'Consider alternatives' }
            ]);
          }
        } catch (error) {
          debugManager.log('Final parse failed', 'error', { error, buffer });
          const cleaned = this.parser.cleanResponse(buffer);
          callbacks.onToken(cleaned);
          callbacks.onComplete([
            { id: 1, text: 'Investigate further' },
            { id: 2, text: 'Take action' },
            { id: 3, text: 'Consider alternatives' }
          ]);
        }
      }
    } catch (error) {
      debugManager.log('Error in generateNextScene', 'error', { error });
      callbacks.onError(error);
    }
  }

  /**
   * Tests API key validity and connection
   * Used for validating user-provided keys
   * 
   * @param apiKey OpenAI API key to test
   * @returns Validation result with error if any
   * 
   * @example
   * ```typescript
   * const result = await openai.testConnection('sk-...');
   * if (result.valid) {
   *   console.log('API key is valid');
   * } else {
   *   console.error('Invalid key:', result.error);
   * }
   * ```
   */
  public async testConnection(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    return this.client.testConnection(apiKey);
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async generateScene(): Promise<Scene> {
 *      return new Promise((resolve, reject) => {
 *        this.openai.generateNextScene(
 *          this.buildPrompt(),
 *          {
 *            onToken: this.handleToken,
 *            onComplete: (choices) => {
 *              resolve(this.buildScene(choices));
 *            },
 *            onError: reject
 *          }
 *        );
 *      });
 *    }
 *    ```
 * 
 * 2. StoryService
 *    ```typescript
 *    // In StoryService
 *    public async generateScene(context: StoryContext): Promise<Scene> {
 *      const scene = await this.openai.generateNextScene(
 *        { context, choice: context.lastChoice },
 *        this.streamCallbacks
 *      );
 *      return this.processScene(scene);
 *    }
 *    ```
 * 
 * 3. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    const handleGenerate = async () => {
 *      await openai.generateNextScene(
 *        buildTestPrompt(),
 *        {
 *          onToken: updateDisplay,
 *          onComplete: showChoices,
 *          onError: handleError
 *        }
 *      );
 *    };
 *    ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await openai.generateNextScene(prompt, {
 *     onToken: handleToken,
 *     onComplete: handleComplete,
 *     onError: (error) => {
 *       if (error.code === 'RATE_LIMIT') {
 *         handleRateLimit();
 *       } else if (error.code === 'TIMEOUT') {
 *         handleTimeout();
 *       } else {
 *         handleGenericError(error);
 *       }
 *     }
 *   });
 * } catch (error) {
 *   handleUnexpectedError(error);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always handle streaming errors
 * 2. Implement proper rate limiting
 * 3. Validate prompts before sending
 * 4. Clean up resources
 * 5. Monitor API usage
 * 
 * Performance Optimization:
 * ```typescript
 * // Optimize token usage
 * const optimizePrompt = (prompt: StoryPrompt) => {
 *   return {
 *     ...prompt,
 *     context: {
 *       ...prompt.context,
 *       // Only keep recent history
 *       history: prompt.context.history.slice(-5),
 *       // Trim long descriptions
 *       currentScene: truncateScene(prompt.context.currentScene)
 *     }
 *   };
 * };
 * 
 * // Batch similar requests
 * const batchRequests = async (prompts: StoryPrompt[]) => {
 *   const results = [];
 *   for (const prompt of prompts) {
 *     await rateLimiter.waitForSlot();
 *     results.push(generateNextScene(prompt));
 *   }
 *   return Promise.all(results);
 * };
 * ```
 * 
 * Cost Management:
 * ```typescript
 * // Track token usage
 * let totalTokens = 0;
 * 
 * const trackUsage = (token: string) => {
 *   totalTokens += token.split(/\s+/).length;
 *   if (totalTokens > WARNING_THRESHOLD) {
 *     notifyHighUsage();
 *   }
 * };
 * 
 * // Estimate costs
 * const estimateCost = () => {
 *   const tokensPerRequest = 1000;
 *   const requestsPerDay = 100;
 *   return calculateDailyCost(tokensPerRequest * requestsPerDay);
 * };
 * ```
 * 
 * @see OpenAIClient for API interaction
 * @see RateLimiter for request throttling
 * @see ResponseParser for content parsing
 */