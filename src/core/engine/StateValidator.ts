/**
 * StateValidator Class
 * 
 * This class provides validation functionality for game states in the AdventureBuildr game engine.
 * It ensures that game states maintain data integrity and contain all required fields
 * before being saved or loaded. The validator works alongside the auto-save system to
 * prevent corruption and maintain state consistency.
 * 
 * Key Features:
 * - Comprehensive state validation
 * - Scene and choice verification
 * - History entry validation
 * - Checkpoint data validation
 * - Error reporting
 * 
 * Data Flow:
 * 1. State reception
 * 2. Structure validation
 * 3. Content verification
 * 4. Error collection
 * 5. Validation result
 * 
 * @see GameEngine for game state integration
 * @see StateManager for state persistence
 * @see GameState for state structure
 */

import type { GameState, Scene } from '../types';
import { debugManager } from '../debug/DebugManager';

export class StateValidator {
  /**
   * Validates a complete game state object
   * Checks all required fields and data structures
   * 
   * @param state Game state to validate
   * @returns true if state is valid, false otherwise
   * 
   * @example
   * ```typescript
   * const isValid = validator.validateState(currentState);
   * if (!isValid) {
   *   throw new Error('Invalid game state');
   * }
   * ```
   */
  public validateState(state: GameState): boolean {
    try {
      // Check required fields
      if (!state || typeof state !== 'object') {
        throw new Error('State must be an object');
      }

      // Validate current scene
      if (!this.validateScene(state.currentScene)) {
        throw new Error('Invalid current scene');
      }

      // Validate history array
      if (!Array.isArray(state.history)) {
        throw new Error('History must be an array');
      }

      // Validate history entries
      for (const entry of state.history) {
        if (!this.validateHistoryEntry(entry)) {
          throw new Error('Invalid history entry');
        }
      }

      // Validate checkpoint if present
      if (state.checkpoint) {
        if (!this.validateScene(state.checkpoint.scene)) {
          throw new Error('Invalid checkpoint scene');
        }
        if (!Array.isArray(state.checkpoint.history)) {
          throw new Error('Checkpoint history must be an array');
        }
      }

      return true;
    } catch (error) {
      debugManager.log('State validation failed', 'error', { error, state });
      return false;
    }
  }

  /**
   * Validates a scene object
   * Checks scene structure and required fields
   * 
   * @param scene Scene to validate
   * @returns true if scene is valid, false otherwise
   * 
   * @example
   * ```typescript
   * if (!validateScene(newScene)) {
   *   throw new Error('Invalid scene structure');
   * }
   * ```
   */
  private validateScene(scene: Scene): boolean {
    if (!scene || typeof scene !== 'object') return false;
    if (typeof scene.id !== 'string') return false;
    if (typeof scene.description !== 'string') return false;
    if (!Array.isArray(scene.choices)) return false;

    // Validate each choice in the scene
    for (const choice of scene.choices) {
      if (!this.validateChoice(choice)) return false;
    }

    return true;
  }

  /**
   * Validates a choice object
   * Ensures choice has required ID and text
   * 
   * @param choice Choice to validate
   * @returns true if choice is valid, false otherwise
   * 
   * @example
   * ```typescript
   * if (!validateChoice(newChoice)) {
   *   throw new Error('Invalid choice structure');
   * }
   * ```
   */
  private validateChoice(choice: any): boolean {
    if (!choice || typeof choice !== 'object') return false;
    if (typeof choice.id !== 'number') return false;
    if (typeof choice.text !== 'string') return false;
    return true;
  }

  /**
   * Validates a history entry
   * Checks required fields and data types
   * 
   * @param entry History entry to validate
   * @returns true if entry is valid, false otherwise
   * 
   * @example
   * ```typescript
   * if (!validateHistoryEntry(newEntry)) {
   *   throw new Error('Invalid history entry');
   * }
   * ```
   */
  private validateHistoryEntry(entry: any): boolean {
    if (!entry || typeof entry !== 'object') return false;
    if (typeof entry.sceneId !== 'string') return false;
    if (typeof entry.choice !== 'string') return false;
    if (entry.sceneDescription && typeof entry.sceneDescription !== 'string') return false;
    if (entry.timestamp && typeof entry.timestamp !== 'string') return false;
    return true;
  }
}

/**
 * Integration Points:
 * 
 * 1. StateManager
 *    ```typescript
 *    // In StateManager
 *    public async saveState(state: GameState): Promise<void> {
 *      if (!this.validator.validateState(state)) {
 *        throw new Error('Invalid state for saving');
 *      }
 *      await this.persistState(state);
 *    }
 *    ```
 * 
 * 2. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private validateGameState(): void {
 *      if (!this.validator.validateState(this.state)) {
 *        throw new Error('Invalid game state');
 *      }
 *    }
 *    ```
 * 
 * 3. CheckpointManager
 *    ```typescript
 *    // In CheckpointManager
 *    public createCheckpoint(state: GameState): GameState {
 *      if (!this.validator.validateState(state)) {
 *        throw new Error('Cannot create checkpoint: Invalid state');
 *      }
 *      return this.createCheckpointState(state);
 *    }
 *    ```
 * 
 * Database Schema Integration:
 * ```sql
 * -- State validation triggers
 * CREATE OR REPLACE FUNCTION validate_game_state()
 * RETURNS trigger AS $$
 * BEGIN
 *   -- Validate required fields
 *   IF NEW.current_scene IS NULL THEN
 *     RAISE EXCEPTION 'Missing current scene';
 *   END IF;
 * 
 *   -- Validate history array
 *   IF NOT jsonb_typeof(NEW.game_state->'history') = 'array' THEN
 *     RAISE EXCEPTION 'History must be an array';
 *   END IF;
 * 
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER validate_game_state_trigger
 *   BEFORE INSERT OR UPDATE ON game_sessions
 *   FOR EACH ROW
 *   EXECUTE FUNCTION validate_game_state();
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   if (!validator.validateState(state)) {
 *     throw new GameError(
 *       'Invalid game state',
 *       ErrorCode.VALIDATION,
 *       'State validation failed'
 *     );
 *   }
 * } catch (error) {
 *   debugManager.log('Validation failed', 'error', { error });
 *   await this.recoverState();
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always validate before state changes
 * 2. Use both client and server validation
 * 3. Provide clear error messages
 * 4. Log validation failures
 * 5. Handle edge cases gracefully
 * 
 * Performance Optimization:
 * ```typescript
 * // Cache validation results
 * private validationCache = new Map<string, boolean>();
 * 
 * public validateState(state: GameState): boolean {
 *   const key = this.getStateKey(state);
 *   if (this.validationCache.has(key)) {
 *     return this.validationCache.get(key)!;
 *   }
 *   
 *   const isValid = this.performValidation(state);
 *   this.validationCache.set(key, isValid);
 *   return isValid;
 * }
 * 
 * // Batch validation
 * public validateStates(states: GameState[]): boolean[] {
 *   return states.map(state => {
 *     try {
 *       return this.validateState(state);
 *     } catch {
 *       return false;
 *     }
 *   });
 * }
 * ```
 * 
 * The validator works alongside the auto-save system to ensure state consistency
 * when multiple updates occur or when restoring from checkpoints.
 * 
 * @see GameEngine for game state integration
 * @see StateManager for state persistence
 * @see GameState for state structure
 */