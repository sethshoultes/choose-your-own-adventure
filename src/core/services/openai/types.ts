/**
 * OpenAI Service Types Module
 * 
 * This module defines the core types and interfaces used by the OpenAI integration in the AdventureBuildr
 * game engine. It provides type definitions for API configuration, story prompts, streaming callbacks,
 * and error handling. The types ensure type safety and consistent data structures across the OpenAI
 * service implementation.
 * 
 * Key Features:
 * - API configuration types
 * - Story prompt structures
 * - Streaming callback interfaces
 * - Error handling types
 * - Model configuration types
 * 
 * @module openai/types
 */

import type { Genre, Character, GameHistoryEntry } from '../../types';

/**
 * Story context for content generation
 * Contains all necessary information for scene generation
 */
export interface StoryContext {
  /** Game genre for appropriate content */
  genre: Genre;
  /** Current player character */
  character: Character;
  /** Current scene description */
  currentScene: string;
  /** Recent game history for context */
  history: GameHistoryEntry[];
}

/**
 * Story prompt for OpenAI requests
 * Combines context with player choice
 */
export interface StoryPrompt {
  /** Current story context */
  context: StoryContext;
  /** Player's selected choice */
  choice: string;
}

/**
 * OpenAI service configuration
 * Defines parameters for API requests
 */
export interface OpenAIConfig {
  /** Model identifier */
  model: string;
  /** Randomness control (0-1) */
  temperature: number;
  /** Maximum response length */
  maxTokens: number;
  /** Repetition penalty (-2 to 2) */
  presencePenalty: number;
  /** Frequency penalty (-2 to 2) */
  frequencyPenalty: number;
  /** Optional metadata */
  metadata?: {
    /** Cost per 1000 tokens */
    costPer1kTokens?: number;
    /** Whether this is a recommended model */
    recommended?: boolean;
  };
}

/**
 * Model configuration for different OpenAI models
 * Extends OpenAIConfig with model-specific information
 */
export interface OpenAIModelConfig {
  /** Model identifier */
  id: string;
  /** Display name */
  name: string;
  /** Model description */
  description: string;
  /** Maximum tokens per request */
  maxTokens: number;
  /** Temperature setting */
  temperature: number;
  /** Presence penalty */
  presencePenalty: number;
  /** Frequency penalty */
  frequencyPenalty: number;
  /** Cost per 1000 tokens */
  costPer1kTokens: number;
  /** Whether this is a recommended model */
  recommended: boolean;
}

/**
 * Callbacks for streaming responses
 * Handles token streaming and completion
 */
export interface OpenAIStreamCallbacks {
  /** Called for each token received */
  onToken: (token: string) => void;
  /** Called when generation is complete */
  onComplete: (choices: Array<{ id: number; text: string }>) => void;
  /** Called if an error occurs */
  onError: (error: Error) => void;
}

/**
 * Custom error class for streaming errors
 * Includes status code and optional error code
 */
export class StreamError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'StreamError';
  }
}

/**
 * OpenAI response structure
 * Defines the expected response format
 */
export interface OpenAIResponse {
  /** Scene description */
  description: string;
  /** Available choices */
  choices: Array<{
    /** Choice identifier */
    id: number;
    /** Choice text */
    text: string;
  }>;
}

/**
 * Integration Points:
 * 
 * 1. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    export class OpenAIService {
 *      private config: OpenAIConfig;
 *      
 *      constructor(config: Partial<OpenAIConfig> = {}) {
 *        this.config = { ...defaultConfig, ...config };
 *      }
 *      
 *      public async generateNextScene(
 *        prompt: StoryPrompt,
 *        callbacks: OpenAIStreamCallbacks
 *      ): Promise<void> {
 *        // Generate scene using prompt and config
 *      }
 *    }
 *    ```
 * 
 * 2. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private buildPrompt(): StoryPrompt {
 *      return {
 *        context: {
 *          genre: this.character.genre,
 *          character: this.character,
 *          currentScene: this.state.currentScene.description,
 *          history: this.state.history
 *        },
 *        choice: this.lastChoice
 *      };
 *    }
 *    ```
 * 
 * 3. Admin Test Panel
 *    ```typescript
 *    // In TestPanel component
 *    const handleGenerate = async () => {
 *      const callbacks: OpenAIStreamCallbacks = {
 *        onToken: updateDisplay,
 *        onComplete: showChoices,
 *        onError: handleError
 *      };
 *      
 *      await openai.generateNextScene(prompt, callbacks);
 *    };
 *    ```
 * 
 * Usage Examples:
 * ```typescript
 * // Configure OpenAI service
 * const config: OpenAIConfig = {
 *   model: 'gpt-4',
 *   temperature: 0.7,
 *   maxTokens: 2000,
 *   presencePenalty: 0.6,
 *   frequencyPenalty: 0.3
 * };
 * 
 * // Create story prompt
 * const prompt: StoryPrompt = {
 *   context: {
 *     genre: 'Fantasy',
 *     character: playerCharacter,
 *     currentScene: 'A dark forest path...',
 *     history: gameHistory
 *   },
 *   choice: 'Explore the cave'
 * };
 * 
 * // Handle streaming response
 * const callbacks: OpenAIStreamCallbacks = {
 *   onToken: (token) => {
 *     appendToScene(token);
 *   },
 *   onComplete: (choices) => {
 *     showPlayerChoices(choices);
 *   },
 *   onError: (error) => {
 *     if (error instanceof StreamError) {
 *       handleStreamError(error);
 *     } else {
 *       handleGenericError(error);
 *     }
 *   }
 * };
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await openai.generateNextScene(prompt, callbacks);
 * } catch (error) {
 *   if (error instanceof StreamError) {
 *     switch (error.status) {
 *       case 401:
 *         handleUnauthorized();
 *         break;
 *       case 429:
 *         handleRateLimit();
 *         break;
 *       default:
 *         handleGenericError(error);
 *     }
 *   }
 * }
 * ```
 * 
 * Type Validation:
 * ```typescript
 * const validateConfig = (config: Partial<OpenAIConfig>): boolean => {
 *   if (config.temperature && 
 *       (config.temperature < 0 || config.temperature > 1)) {
 *     return false;
 *   }
 *   
 *   if (config.maxTokens && config.maxTokens < 1) {
 *     return false;
 *   }
 *   
 *   return true;
 * };
 * 
 * const validatePrompt = (prompt: StoryPrompt): boolean => {
 *   if (!prompt.context.genre || !prompt.context.character) {
 *     return false;
 *   }
 *   
 *   if (!prompt.choice?.trim()) {
 *     return false;
 *   }
 *   
 *   return true;
 * };
 * ```
 * 
 * Best Practices:
 * 1. Always validate configurations
 * 2. Handle all error types
 * 3. Use proper type annotations
 * 4. Document type constraints
 * 5. Consider performance implications
 * 
 * @see OpenAIService for service implementation
 * @see OpenAIClient for API interaction
 * @see GameEngine for integration
 */