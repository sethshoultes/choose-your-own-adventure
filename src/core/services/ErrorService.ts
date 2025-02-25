/**
 * ErrorService Class
 * 
 * This service provides centralized error handling, tracking, and management for the AdventureBuildr game engine.
 * It standardizes error handling across the application, provides error categorization, and ensures proper
 * error recovery and logging. The service works alongside the auto-save system to maintain state integrity
 * during error conditions.
 * 
 * Key Features:
 * - Centralized error handling
 * - Error categorization and codes
 * - Custom error types
 * - Error recovery strategies
 * - Comprehensive logging
 * 
 * @see GameEngine for integration with the main game loop
 * @see StateManager for state error handling
 * @see debugManager for error logging
 */

import { debugManager } from '../debug/DebugManager';

/**
 * Error codes for different types of errors in the system
 * Used for categorization and specific handling strategies
 */
export enum ErrorCode {
  // Database Errors
  DB_CONNECTION = 'DB_CONNECTION',
  DB_QUERY = 'DB_QUERY',
  DB_TRANSACTION = 'DB_TRANSACTION',
  
  // Game State Errors
  INVALID_STATE = 'INVALID_STATE',
  STATE_SAVE = 'STATE_SAVE',
  STATE_LOAD = 'STATE_LOAD',
  
  // Character Errors
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
  CHARACTER_VALIDATION = 'CHARACTER_VALIDATION',
  
  // Session Errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_INVALID = 'SESSION_INVALID',
  
  // OpenAI Errors
  AI_CONNECTION = 'AI_CONNECTION',
  AI_RESPONSE = 'AI_RESPONSE',
  AI_TIMEOUT = 'AI_TIMEOUT',
  
  // Authentication Errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  
  // Validation Errors
  VALIDATION = 'VALIDATION',
  
  // Unknown Error
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom error class for game-specific errors
 * Includes error code and context for better error handling
 */
export class GameError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: any
  ) {
    super(message);
    this.name = 'GameError';
  }
}

/**
 * Main error service class
 * Handles error registration, processing, and recovery
 */
export class ErrorService {
  private static instance: ErrorService;
  private handlers: Map<ErrorCode, (error: GameError) => void> = new Map();

  private constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Gets the singleton instance of the error service
   * Creates new instance if one doesn't exist
   */
  public static getInstance(): ErrorService {
    if (!this.instance) {
      this.instance = new ErrorService();
    }
    return this.instance;
  }

  /**
   * Registers a custom error handler for a specific error code
   * 
   * @param code Error code to handle
   * @param handler Function to handle the error
   * 
   * @example
   * ```typescript
   * errorService.registerHandler(
   *   ErrorCode.DB_CONNECTION,
   *   (error) => {
   *     // Retry database connection
   *     retryConnection();
   *   }
   * );
   * ```
   */
  public registerHandler(
    code: ErrorCode,
    handler: (error: GameError) => void
  ): void {
    this.handlers.set(code, handler);
  }

  /**
   * Main error handling method
   * Routes errors to appropriate handlers and logs them
   * 
   * @param error Error to handle
   * 
   * @example
   * ```typescript
   * try {
   *   await saveGameState();
   * } catch (error) {
   *   errorService.handleError(error);
   * }
   * ```
   */
  public handleError(error: Error): void {
    const gameError = this.normalizeError(error);
    
    debugManager.log('Handling error', 'error', {
      code: gameError.code,
      message: gameError.message,
      context: gameError.context
    });

    const handler = this.handlers.get(gameError.code);
    if (handler) {
      handler(gameError);
    } else {
      this.defaultHandler(gameError);
    }
  }

  /**
   * Normalizes different error types into GameError format
   * 
   * @param error Error to normalize
   * @returns Normalized GameError
   */
  private normalizeError(error: any): GameError {
    if (error instanceof GameError) {
      return error;
    }

    // Database errors
    if (error.code?.startsWith('PGRST')) {
      return new GameError(
        error.message || 'Database error',
        ErrorCode.DB_QUERY,
        error
      );
    }

    // OpenAI errors
    if (error.response?.status === 429) {
      return new GameError(
        'OpenAI rate limit exceeded',
        ErrorCode.AI_TIMEOUT,
        error
      );
    }

    // Authentication errors
    if (error.message?.includes('not authenticated')) {
      return new GameError(
        'Authentication required',
        ErrorCode.AUTH_REQUIRED,
        error
      );
    }

    // Default unknown error
    return new GameError(
      error.message || 'An unknown error occurred',
      ErrorCode.UNKNOWN,
      error
    );
  }

  /**
   * Default error handler for unhandled errors
   * 
   * @param error Error to handle
   */
  private defaultHandler(error: GameError): void {
    debugManager.log('Unhandled error', 'error', {
      code: error.code,
      message: error.message,
      context: error.context
    });
  }

  /**
   * Registers default error handlers for common error types
   */
  private registerDefaultHandlers(): void {
    // Database errors
    this.registerHandler(ErrorCode.DB_CONNECTION, (error) => {
      debugManager.log('Database connection error - retrying operation', 'error', {
        message: error.message,
        context: error.context
      });
    });

    // State errors
    this.registerHandler(ErrorCode.INVALID_STATE, (error) => {
      debugManager.log('Invalid game state - attempting recovery', 'error', {
        message: error.message,
        context: error.context
      });
    });

    // OpenAI errors
    this.registerHandler(ErrorCode.AI_TIMEOUT, (error) => {
      debugManager.log('OpenAI timeout - retrying with backoff', 'error', {
        message: error.message,
        context: error.context
      });
    });

    // Authentication errors
    this.registerHandler(ErrorCode.AUTH_REQUIRED, (error) => {
      debugManager.log('Authentication required - redirecting to login', 'error', {
        message: error.message,
        context: error.context
      });
    });

    // Add default handler for unhandled errors
    this.registerHandler(ErrorCode.UNKNOWN, (error) => {
      debugManager.log('Unhandled error occurred', 'error', {
        message: error.message,
        context: error.context
      });
    });
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    try {
 *      await this.saveGameState();
 *    } catch (error) {
 *      this.errorService.handleError(error);
 *      await this.recoverState();
 *    }
 *    ```
 * 
 * 2. StateManager
 *    ```typescript
 *    // In StateManager
 *    try {
 *      await this.validateState(state);
 *    } catch (error) {
 *      throw new GameError(
 *        'Invalid game state',
 *        ErrorCode.INVALID_STATE,
 *        error
 *      );
 *    }
 *    ```
 * 
 * 3. OpenAIService
 *    ```typescript
 *    // In OpenAIService
 *    try {
 *      await this.makeRequest();
 *    } catch (error) {
 *      if (error.response?.status === 429) {
 *        throw new GameError(
 *          'Rate limit exceeded',
 *          ErrorCode.AI_TIMEOUT,
 *          error
 *        );
 *      }
 *    }
 *    ```
 * 
 * Best Practices:
 * 1. Always use GameError for custom errors
 * 2. Include relevant context with errors
 * 3. Log all errors properly
 * 4. Implement proper recovery
 * 5. Handle all error cases
 * 
 * Error Recovery:
 * ```typescript
 * try {
 *   await operation();
 * } catch (error) {
 *   this.errorService.handleError(error);
 *   
 *   if (error instanceof GameError) {
 *     switch (error.code) {
 *       case ErrorCode.STATE_SAVE:
 *         await this.retryStateSave();
 *         break;
 *       case ErrorCode.DB_CONNECTION:
 *         await this.reconnectDatabase();
 *         break;
 *       default:
 *         await this.defaultRecovery();
 *     }
 *   }
 * }
 * ```
 * 
 * @see debugManager for error logging
 * @see GameEngine for game error handling
 * @see StateManager for state error handling
 */