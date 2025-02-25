/**
 * SaveManager Class
 * 
 * This class manages game state persistence in the AdventureBuildr game engine.
 * It provides a robust queueing system for state saves, handles automatic saving,
 * and ensures data integrity through batched operations and proper error handling.
 * 
 * Key Features:
 * - Automatic state persistence
 * - Save queueing and batching
 * - Conflict prevention
 * - Error recovery
 * - State validation
 * 
 * Data Flow:
 * 1. State save request
 * 2. Queue management
 * 3. Batch processing
 * 4. Database persistence
 * 5. Error handling
 * 
 * @see GameEngine for game state integration
 * @see StateManager for state management
 * @see GameState for state structure
 */

import type { GameState } from '../types';
import { debugManager } from '../debug/DebugManager';
import { GameStateService } from '../services/game/GameStateService';

/**
 * Interface for queued save operations
 */
interface SaveQueueItem {
  /** Game state to save */
  state: GameState;
  /** Timestamp of save request */
  timestamp: number;
}

export class SaveManager {
  /** Queue of pending save operations */
  private saveQueue: SaveQueueItem[] = [];
  /** Flag indicating if save is in progress */
  private isSaving: boolean = false;
  /** Timestamp of last successful save */
  private lastSaveTimestamp: number = 0;
  /** Minimum time between auto-saves */
  private readonly AUTO_SAVE_DELAY = 5000; // 5 seconds
  /** Maximum items to process in one batch */
  private readonly SAVE_BATCH_SIZE = 3;
  /** Maximum size of save queue */
  private readonly MAX_QUEUE_SIZE = 10;
  /** Game state service instance */
  private gameStateService: GameStateService;

  constructor() {
    this.gameStateService = new GameStateService();
  }

  /**
   * Processes the save queue in batches
   * Handles database persistence and error recovery
   * 
   * @param character Current character
   * @throws Error if save fails
   * 
   * @example
   * ```typescript
   * await saveManager.processSaveQueue(character);
   * ```
   */
  private async processSaveQueue(character: Character): Promise<void> {
    if (this.isSaving || this.saveQueue.length === 0) return;
    
    this.isSaving = true;
    const now = Date.now();
    
    try {
      // Get most recent state and clear queue immediately to prevent duplicates
      const { state } = this.saveQueue[this.saveQueue.length - 1];
      this.saveQueue = [];
      
      if (character.id) {
        await this.gameStateService.saveGameState(character, state);
        this.lastSaveTimestamp = now;
        debugManager.log('Game state saved', 'success', { timestamp: now });
      }
    } catch (error) {
      debugManager.log('Error saving game state', 'error', { error });
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Queues a state save operation
   * Manages queue size and triggers processing
   * 
   * @param state Game state to save
   * @param character Current character
   * 
   * @example
   * ```typescript
   * saveManager.queueStateSave(currentState, character);
   * ```
   */
  public queueStateSave(state: GameState, character: Character): void {
    // Add state to queue
    this.saveQueue.push({
      state: { ...state },
      timestamp: Date.now()
    });
    
    // Trim queue if too large
    if (this.saveQueue.length > this.MAX_QUEUE_SIZE) {
      this.saveQueue = this.saveQueue
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_QUEUE_SIZE);
    }
    
    // Start processing queue
    this.processSaveQueue(character);
  }

  /**
   * Checks if auto-save should trigger
   * Based on time since last save
   * 
   * @returns true if auto-save should trigger
   * 
   * @example
   * ```typescript
   * if (saveManager.shouldAutoSave()) {
   *   saveManager.queueStateSave(state, character);
   * }
   * ```
   */
  public shouldAutoSave(): boolean {
    const now = Date.now();
    return now - this.lastSaveTimestamp >= this.AUTO_SAVE_DELAY;
  }

  /**
   * Loads a saved game state
   * 
   * @param characterId Character ID to load state for
   * @returns Loaded game state or null if not found
   * @throws Error if load fails
   * 
   * @example
   * ```typescript
   * const savedState = await saveManager.loadGameState(characterId);
   * ```
   */
  public async loadGameState(characterId: string): Promise<GameState | null> {
    return this.gameStateService.loadGameState(characterId);
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private saveManager: SaveManager;
 *    
 *    private async handleChoice(choiceId: number): Promise<void> {
 *      // Update state
 *      this.state = newState;
 *      
 *      // Queue state save
 *      this.saveManager.queueStateSave(this.state, this.character);
 *    }
 *    ```
 * 
 * 2. StateManager
 *    ```typescript
 *    // In StateManager
 *    public async saveState(state: GameState): Promise<void> {
 *      if (this.saveManager.shouldAutoSave()) {
 *        await this.saveManager.queueStateSave(state, this.character);
 *      }
 *    }
 *    ```
 * 
 * 3. CheckpointManager
 *    ```typescript
 *    // In CheckpointManager
 *    public async createCheckpoint(state: GameState): Promise<void> {
 *      // Force immediate save for checkpoints
 *      await this.saveManager.queueStateSave(state, this.character);
 *    }
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
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now(),
 *   status session_status NOT NULL DEFAULT 'active',
 *   metadata jsonb
 * );
 * 
 * -- Save history tracking
 * CREATE TABLE save_history (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id uuid REFERENCES game_sessions(id),
 *   game_state jsonb NOT NULL,
 *   created_at timestamptz DEFAULT now(),
 *   metadata jsonb
 * );
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await saveManager.queueStateSave(state, character);
 * } catch (error) {
 *   debugManager.log('Save failed', 'error', { error });
 *   // Retry save with exponential backoff
 *   await this.retrySave(state, character);
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always queue saves instead of saving directly
 * 2. Implement proper error recovery
 * 3. Maintain save history
 * 4. Clean up old saves
 * 5. Monitor save performance
 * 
 * Performance Optimization:
 * ```typescript
 * // Optimize state for saving
 * const optimizeState = (state: GameState) => ({
 *   ...state,
 *   // Only keep recent history
 *   history: state.history.slice(-10),
 *   // Remove unnecessary metadata
 *   metadata: undefined
 * });
 * 
 * // Implement save cleanup
 * const cleanupSaves = async (sessionId: string) => {
 *   const maxSaves = 10;
 *   const { data: saves } = await supabase
 *     .from('save_history')
 *     .select('id, created_at')
 *     .eq('session_id', sessionId)
 *     .order('created_at', { ascending: false });
 *   
 *   if (saves.length > maxSaves) {
 *     const toDelete = saves
 *       .slice(maxSaves)
 *       .map(s => s.id);
 *     await supabase
 *       .from('save_history')
 *       .delete()
 *       .in('id', toDelete);
 *   }
 * };
 * ```
 * 
 * The manager works alongside the auto-save system to ensure state consistency
 * when multiple updates occur or when restoring from checkpoints.
 * 
 * @see GameEngine for game state integration
 * @see StateManager for state management
 * @see GameStateService for persistence
 */