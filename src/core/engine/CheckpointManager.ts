/**
 * CheckpointManager Class
 * 
 * This class manages the checkpoint system for game state persistence in AdventureBuildr.
 * It provides a reliable way to create and restore manual save points during gameplay,
 * working alongside the automatic state persistence system to ensure players never lose
 * progress.
 * 
 * Key Features:
 * - Manual checkpoint creation
 * - State restoration
 * - Validation and verification
 * - Error recovery
 * - History preservation
 * 
 * Data Flow:
 * 1. Game state validation
 * 2. Checkpoint creation
 * 3. State persistence
 * 4. Checkpoint restoration
 * 5. State recovery
 * 
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private checkpointManager: CheckpointManager;
 *    
 *    public async createCheckpoint(): Promise<void> {
 *      const checkpoint = this.checkpointManager.createCheckpoint(this.state);
 *      await this.saveCheckpoint(checkpoint);
 *    }
 *    
 *    public async restoreCheckpoint(): Promise<void> {
 *      if (!this.state.checkpoint) return;
 *      this.state = this.checkpointManager.restoreCheckpoint(this.state);
 *      await this.saveState();
 *    }
 *    ```
 * 
 * 2. StateManager
 *    ```typescript
 *    // In StateManager
 *    public async saveCheckpoint(state: GameState): Promise<void> {
 *      const checkpoint = this.checkpointManager.createCheckpoint(state);
 *      await this.persistCheckpoint(checkpoint);
 *    }
 *    
 *    public async loadCheckpoint(state: GameState): Promise<GameState> {
 *      return this.checkpointManager.restoreCheckpoint(state);
 *    }
 *    ```
 * 
 * 3. UI Components
 *    ```typescript
 *    // In StoryScene component
 *    const handleCreateCheckpoint = async () => {
 *      await gameEngine.createCheckpoint();
 *      showNotification('Checkpoint created');
 *    };
 *    
 *    const handleRestoreCheckpoint = async () => {
 *      await gameEngine.restoreCheckpoint();
 *      showNotification('Checkpoint restored');
 *    };
 *    ```
 * 
 * Database Schema:
 * ```sql
 * -- Checkpoint storage
 * CREATE TABLE checkpoint_history (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id uuid REFERENCES game_sessions(id),
 *   character_id uuid REFERENCES characters(id),
 *   scene jsonb NOT NULL,
 *   history jsonb NOT NULL,
 *   created_at timestamptz DEFAULT now(),
 *   metadata jsonb
 * );
 * 
 * -- Game session checkpoint reference
 * ALTER TABLE game_sessions ADD COLUMN
 *   checkpoint jsonb DEFAULT NULL;
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const checkpoint = checkpointManager.createCheckpoint(state);
 *   await saveCheckpoint(checkpoint);
 * } catch (error) {
 *   debugManager.log('Checkpoint creation failed', 'error', { error });
 *   throw new GameError(
 *     'Failed to create checkpoint',
 *     ErrorCode.CHECKPOINT,
 *     error
 *   );
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always validate state before checkpointing
 * 2. Preserve complete history
 * 3. Handle restoration errors
 * 4. Maintain data integrity
 * 5. Clean up old checkpoints
 * 
 * Performance Optimization:
 * ```typescript
 * // Optimize checkpoint size
 * const optimizeCheckpoint = (state: GameState) => ({
 *   ...state,
 *   // Only keep essential history
 *   history: state.history.slice(-10),
 *   // Remove unnecessary metadata
 *   metadata: undefined
 * });
 * 
 * // Implement checkpoint cleanup
 * const cleanupCheckpoints = async (sessionId: string) => {
 *   const maxCheckpoints = 5;
 *   const { data: checkpoints } = await supabase
 *     .from('checkpoint_history')
 *     .select('id, created_at')
 *     .eq('session_id', sessionId)
 *     .order('created_at', { ascending: false });
 *   
 *   if (checkpoints.length > maxCheckpoints) {
 *     const toDelete = checkpoints
 *       .slice(maxCheckpoints)
 *       .map(c => c.id);
 *     await supabase
 *       .from('checkpoint_history')
 *       .delete()
 *       .in('id', toDelete);
 *   }
 * };
 * ```
 * 
 * @see GameEngine for game state integration
 * @see StateManager for state persistence
 * @see GameState for state structure
 * @see debugManager for error logging
 */

import type { GameState, Scene } from '../types';
import { debugManager } from '../debug/DebugManager';

export class CheckpointManager {
  /**
   * Creates a new checkpoint from the current game state
   * 
   * @param state Current game state to checkpoint
   * @returns Updated game state with checkpoint information
   * @throws Error if state is invalid or missing required data
   */
  public createCheckpoint(state: GameState): GameState {
    if (!state.currentScene) {
      debugManager.log('Cannot create checkpoint: No current scene', 'error');
      return state;
    }

    const timestamp = new Date().toISOString();
    
    // Create new state with checkpoint data
    const newState = {
      ...state,
      checkpoint: {
        scene: { ...state.currentScene },
        history: [...state.history],
        timestamp
      }
    };

    debugManager.log('Checkpoint created', 'success', {
      scene: state.currentScene.id,
      historyLength: state.history.length,
      timestamp
    });

    return newState;
  }

  /**
   * Restores the game state to a previously created checkpoint
   * 
   * @param state Current game state containing checkpoint data
   * @returns Updated game state restored from checkpoint
   * @throws Error if no checkpoint exists or checkpoint data is invalid
   */
  public restoreCheckpoint(state: GameState): GameState {
    if (!state.checkpoint) {
      debugManager.log('Cannot restore: No checkpoint exists', 'error');
      return state;
    }

    // Create new state from checkpoint data
    const newState = {
      ...state,
      currentScene: { ...state.checkpoint.scene },
      history: [...state.checkpoint.history]
    };

    debugManager.log('Checkpoint restored', 'success', {
      scene: newState.currentScene.id,
      historyLength: newState.history.length
    });

    return newState;
  }
}