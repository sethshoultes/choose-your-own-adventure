/**
 * StateManager Class
 * 
 * This class manages game state persistence, validation, versioning, and conflict resolution
 * in the AdventureBuildr game engine. It provides a robust system for saving and loading
 * game states while maintaining data integrity and handling potential conflicts.
 * 
 * Key Features:
 * - State validation and integrity checks
 * - Version control and migration
 * - Conflict resolution for concurrent updates
 * - Automatic state recovery
 * - Error handling and logging
 * 
 * Data Flow:
 * 1. State validation
 * 2. Version checking
 * 3. Conflict detection
 * 4. State merging
 * 5. Database persistence
 * 
 * @see GameEngine for game state integration
 * @see StateValidator for state validation
 * @see StateVersioner for version control
 * @see ConflictResolver for handling state conflicts
 */

import type { GameState } from '../types';
import { debugManager } from '../debug/DebugManager';
import { StateValidator } from './StateValidator';
import { StateVersioner } from './StateVersioner';
import { ConflictResolver } from './ConflictResolver';

export class StateManager {
  /** Validates game state integrity */
  private validator: StateValidator;
  /** Handles state versioning and migration */
  private versioner: StateVersioner;
  /** Resolves conflicts between states */
  private conflictResolver: ConflictResolver;
  /** Maximum number of save retries */
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.validator = new StateValidator();
    this.versioner = new StateVersioner();
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * Saves the current game state with validation and conflict resolution
   * 
   * @param state Game state to save
   * @param characterId Character ID for the state
   * @throws Error if state is invalid or save fails
   * 
   * @example
   * ```typescript
   * await stateManager.saveState(currentState, character.id);
   * ```
   */
  public async saveState(state: GameState, characterId: string): Promise<void> {
    try {
      // Validate state before saving
      if (!this.validator.validateState(state)) {
        throw new Error('Invalid game state');
      }

      // Version the state for persistence
      const versionedState = this.versioner.versionState(state);

      // Save with retry logic
      let retries = 0;
      while (retries < this.MAX_RETRIES) {
        try {
          await this.saveStateToDb(versionedState, characterId);
          break;
        } catch (error) {
          if (error.code === 'P2002') { // Unique constraint violation
            const resolvedState = await this.conflictResolver.resolveConflict(
              versionedState,
              await this.loadLatestState(characterId)
            );
            await this.saveStateToDb(resolvedState, characterId);
            break;
          }
          retries++;
          if (retries === this.MAX_RETRIES) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    } catch (error) {
      debugManager.log('Error saving game state', 'error', { error });
      throw error;
    }
  }

  /**
   * Loads and validates a game state
   * 
   * @param characterId Character ID to load state for
   * @returns Loaded game state or null if not found
   * @throws Error if state cannot be loaded or validated
   * 
   * @example
   * ```typescript
   * const savedState = await stateManager.loadState(character.id);
   * ```
   */
  public async loadState(characterId: string): Promise<GameState | null> {
    try {
      const state = await this.loadLatestState(characterId);
      if (!state) return null;

      // Validate loaded state
      if (!this.validator.validateState(state)) {
        debugManager.log('Invalid state loaded', 'error', { state });
        const recoveredState = await this.recoverState(characterId);
        if (recoveredState) {
          return recoveredState;
        }
        throw new Error('Failed to recover valid game state');
      }

      // Migrate state version if needed
      return this.versioner.migrateState(state);
    } catch (error) {
      debugManager.log('Error loading game state', 'error', { error });
      throw error;
    }
  }

  /**
   * Saves state to database
   * Implementation in GameStateService
   */
  private async saveStateToDb(state: GameState, characterId: string): Promise<void> {
    // Implementation in GameStateService
  }

  /**
   * Loads the latest state from database
   * Implementation in GameStateService
   */
  private async loadLatestState(characterId: string): Promise<GameState | null> {
    // Implementation in GameStateService
    return null;
  }

  /**
   * Attempts to recover a valid state through various methods
   * 
   * @param characterId Character ID to recover state for
   * @returns Recovered state or null if recovery fails
   */
  private async recoverState(characterId: string): Promise<GameState | null> {
    try {
      // Try to recover from checkpoint first
      const checkpointState = await this.loadCheckpoint(characterId);
      if (checkpointState && this.validator.validateState(checkpointState)) {
        return checkpointState;
      }

      // Try to reconstruct from history
      return await this.reconstructFromHistory(characterId);
    } catch (error) {
      debugManager.log('Error recovering state', 'error', { error });
      return null;
    }
  }

  /**
   * Loads state from checkpoint
   * Implementation in GameStateService
   */
  private async loadCheckpoint(characterId: string): Promise<GameState | null> {
    // Implementation in GameStateService
    return null;
  }

  /**
   * Reconstructs state from history
   * Implementation in GameStateService
   */
  private async reconstructFromHistory(characterId: string): Promise<GameState | null> {
    // Implementation in GameStateService
    return null;
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private stateManager: StateManager;
 *    
 *    public async saveGameState(): Promise<void> {
 *      await this.stateManager.saveState(
 *        this.state,
 *        this.character.id
 *      );
 *    }
 *    
 *    public async loadGameState(): Promise<void> {
 *      const state = await this.stateManager.loadState(
 *        this.character.id
 *      );
 *      if (state) {
 *        this.state = state;
 *      }
 *    }
 *    ```
 * 
 * 2. CheckpointManager
 *    ```typescript
 *    // In CheckpointManager
 *    public async createCheckpoint(state: GameState): Promise<void> {
 *      const checkpoint = {
 *        ...state,
 *        checkpoint: {
 *          scene: state.currentScene,
 *          history: state.history,
 *          timestamp: new Date().toISOString()
 *        }
 *      };
 *      await this.stateManager.saveState(checkpoint, state.characterId);
 *    }
 *    ```
 * 
 * 3. UI Components
 *    ```typescript
 *    // In StoryScene component
 *    const handleSave = async () => {
 *      try {
 *        await gameEngine.saveGameState();
 *        showNotification('Game saved');
 *      } catch (error) {
 *        showError('Failed to save game');
 *      }
 *    };
 *    ```
 * 
 * Database Schema:
 * ```sql
 * -- Game state storage
 * CREATE TABLE game_sessions (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   character_id uuid REFERENCES characters(id),
 *   current_scene jsonb NOT NULL,
 *   game_state jsonb NOT NULL,
 *   version text,
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now(),
 *   status session_status NOT NULL DEFAULT 'active',
 *   metadata jsonb
 * );
 * 
 * -- State history tracking
 * CREATE TABLE state_history (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id uuid REFERENCES game_sessions(id),
 *   game_state jsonb NOT NULL,
 *   version text NOT NULL,
 *   created_at timestamptz DEFAULT now(),
 *   metadata jsonb
 * );
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await stateManager.saveState(state, characterId);
 * } catch (error) {
 *   debugManager.log('State save failed', 'error', { error });
 *   if (error.code === 'INVALID_STATE') {
 *     await handleInvalidState();
 *   } else if (error.code === 'CONFLICT') {
 *     await handleStateConflict();
 *   } else {
 *     throw new GameError(
 *       'Failed to save game state',
 *       ErrorCode.STATE_SAVE,
 *       error
 *     );
 *   }
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always validate states before saving
 * 2. Handle version conflicts gracefully
 * 3. Implement proper error recovery
 * 4. Maintain state history
 * 5. Clean up old states
 * 
 * Performance Optimization:
 * ```typescript
 * // Implement state caching
 * private readonly stateCache = new Map<string, GameState>();
 * 
 * private async getCachedState(
 *   characterId: string
 * ): Promise<GameState | null> {
 *   if (this.stateCache.has(characterId)) {
 *     return this.stateCache.get(characterId)!;
 *   }
 *   
 *   const state = await this.loadState(characterId);
 *   if (state) {
 *     this.stateCache.set(characterId, state);
 *   }
 *   return state;
 * }
 * 
 * // Batch state updates
 * private async batchSaveStates(
 *   states: Array<{ state: GameState; characterId: string }>
 * ): Promise<void> {
 *   const validStates = states.filter(({ state }) => 
 *     this.validator.validateState(state)
 *   );
 *   
 *   await Promise.all(
 *     validStates.map(({ state, characterId }) =>
 *       this.saveStateToDb(state, characterId)
 *     )
 *   );
 * }
 * ```
 * 
 * The manager works alongside the auto-save system to ensure state consistency
 * when multiple updates occur or when restoring from checkpoints.
 * 
 * @see GameEngine for game state integration
 * @see StateValidator for state validation
 * @see StateVersioner for version control
 * @see ConflictResolver for conflict handling
 */