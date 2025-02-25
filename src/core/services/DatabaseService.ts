/**
 * DatabaseService Class
 * 
 * This service provides a robust interface for database operations in AdventureBuildr,
 * handling caching, retries, error handling, and transaction management. It works
 * alongside the auto-save system to ensure reliable data persistence.
 * 
 * Key Features:
 * - Operation caching with TTL
 * - Automatic retry logic
 * - Transaction management
 * - Error handling and logging
 * - Cache invalidation
 * 
 * @see GameEngine for integration with the main game loop
 * @see GameStateService for state persistence
 * @see StateManager for state management
 */

import { supabase } from '../../lib/supabase';
import { debugManager } from '../debug/DebugManager';

interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Cache entry timestamp */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

export class DatabaseService {
  /** In-memory cache storage */
  private cache: Map<string, CacheEntry<any>> = new Map();
  /** Default cache TTL in milliseconds */
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Executes a database operation with caching and retry logic
   * 
   * @param key Cache key for the operation
   * @param operation Database operation to execute
   * @param options Operation configuration
   * @returns Operation result
   * @throws Error if operation fails after retries
   * 
   * @example
   * ```typescript
   * const result = await db.operation(
   *   'character:123',
   *   async () => {
   *     const { data } = await supabase
   *       .from('characters')
   *       .select('*')
   *       .eq('id', '123')
   *       .single();
   *     return data;
   *   },
   *   { ttl: 60000, maxRetries: 3 }
   * );
   * ```
   */
  public async operation<T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      ttl?: number;
      bypassCache?: boolean;
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ): Promise<T> {
    const { 
      ttl = this.DEFAULT_TTL, 
      bypassCache = false,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    // Check cache if not bypassing
    if (!bypassCache) {
      const cached = this.getFromCache<T>(key);
      if (cached) {
        debugManager.log('Cache hit', 'info', { key });
        return cached;
      }
    }

    let attempts = 0;
    let lastError: any;

    while (attempts < maxRetries) {
      try {
        // Perform operation
        const result = await operation();

        // Cache result
        this.setInCache(key, result, ttl);

        return result;
      } catch (error) {
        attempts++;
        
        if (attempts === maxRetries) {
          debugManager.log('Max retries reached', 'error', { 
            attempts,
            error 
          });
          throw error;
        }

        const delay = retryDelay * Math.pow(2, attempts - 1);
        debugManager.log('Operation failed, retrying', 'warning', {
          key,
          attempt: attempts,
          delay,
          error
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    debugManager.log('Database operation failed after retries', 'error', {
      key,
      attempts,
      error: lastError
    });
    throw lastError;
  }

  /**
   * Executes multiple operations in sequence with error handling
   * 
   * @param operations Array of operations to execute
   * @param errorHandler Optional error handler
   * @returns Array of operation results
   * @throws Error if any operation fails
   * 
   * @example
   * ```typescript
   * const results = await db.transaction([
   *   () => saveGameState(state),
   *   () => updateCharacter(character),
   *   () => trackProgress(progress)
   * ]);
   * ```
   */
  public async transaction<T>(
    operations: Array<() => Promise<T>>,
    errorHandler?: (error: any) => Promise<void>
  ): Promise<T[]> {
    const results: T[] = [];

    try {
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }
      return results;
    } catch (error) {
      debugManager.log('Transaction failed', 'error', { error });
      if (errorHandler) {
        await errorHandler(error);
      }
      throw error;
    }
  }

  /**
   * Invalidates cache entries
   * 
   * @param key Optional specific key to invalidate
   * 
   * @example
   * ```typescript
   * // Invalidate specific entry
   * db.invalidateCache('character:123');
   * 
   * // Invalidate all entries
   * db.invalidateCache();
   * ```
   */
  public invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      debugManager.log('Cache entry invalidated', 'info', { key });
    } else {
      this.cache.clear();
      debugManager.log('Cache cleared', 'info');
    }
  }

  /**
   * Retrieves an entry from the cache
   * 
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      debugManager.log('Cache entry expired', 'info', { key });
      return null;
    }

    return entry.data;
  }

  /**
   * Stores an entry in the cache
   * 
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in milliseconds
   */
  private setInCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    debugManager.log('Cache entry set', 'info', { key, ttl });
  }

  /**
   * Retries an operation with exponential backoff
   * 
   * @param operation Operation to retry
   * @param options Retry configuration
   * @returns Operation result
   * @throws Error if operation fails after retries
   * 
   * @example
   * ```typescript
   * const result = await db.retryOperation(
   *   async () => saveGameState(state),
   *   { maxRetries: 3, delayMs: 1000 }
   * );
   * ```
   */
  public async retryOperation<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      delayMs?: number;
      backoff?: boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      backoff = true
    } = options;

    let attempts = 0;
    let lastError: any;

    while (attempts < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        
        if (attempts === maxRetries) {
          debugManager.log('Max retries reached', 'error', { 
            attempts,
            error 
          });
          throw error;
        }

        const delay = backoff ? delayMs * Math.pow(2, attempts - 1) : delayMs;
        debugManager.log('Operation failed, retrying', 'warning', {
          attempts,
          delay,
          error
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        lastError = error;
      }
    }

    debugManager.log('Retry operation failed', 'error', {
      attempts,
      error: lastError
    });
    throw lastError;
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async saveGameState(): Promise<void> {
 *      await this.database.operation(
 *        `gameState:${this.character.id}`,
 *        async () => {
 *          const { error } = await supabase
 *            .from('game_sessions')
 *            .upsert({
 *              id: this.state.sessionId,
 *              character_id: this.character.id,
 *              current_scene: this.state.currentScene,
 *              game_state: this.state
 *            });
 *          if (error) throw error;
 *        },
 *        { ttl: 0 } // No caching for state saves
 *      );
 *    }
 *    ```
 * 
 * 2. ProgressionService
 *    ```typescript
 *    // In ProgressionService
 *    public async awardXP(character: Character, amount: number): Promise<void> {
 *      await this.database.operation(
 *        `xp:${character.id}`,
 *        async () => {
 *          const { error } = await supabase
 *            .from('characters')
 *            .update({
 *              experience_points: character.experience_points + amount
 *            })
 *            .eq('id', character.id);
 *          if (error) throw error;
 *        }
 *      );
 *    }
 *    ```
 * 
 * 3. AchievementService
 *    ```typescript
 *    // In AchievementService
 *    public async getAchievements(userId: string): Promise<Achievement[]> {
 *      return this.database.operation(
 *        `achievements:${userId}`,
 *        async () => {
 *          const { data, error } = await supabase
 *            .from('achievements')
 *            .select('*')
 *            .eq('user_id', userId);
 *          if (error) throw error;
 *          return data;
 *        },
 *        { ttl: 60000 } // Cache for 1 minute
 *      );
 *    }
 *    ```
 * 
 * Best Practices:
 * 1. Use appropriate cache TTLs
 * 2. Handle retries properly
 * 3. Log all operations
 * 4. Use transactions when needed
 * 5. Invalidate cache strategically
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await database.operation(
 *     'key',
 *     async () => {
 *       // Operation
 *     },
 *     {
 *       maxRetries: 3,
 *       retryDelay: 1000
 *     }
 *   );
 * } catch (error) {
 *   debugManager.log('Operation failed', 'error', { error });
 *   throw new GameError(
 *     'Database operation failed',
 *     ErrorCode.DB_ERROR,
 *     error
 *   );
 * }
 * ```
 * 
 * @see supabase for database client
 * @see debugManager for logging
 */