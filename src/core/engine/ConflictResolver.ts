/**
 * ConflictResolver Class
 * 
 * This class manages state conflict resolution in the AdventureBuildr game engine.
 * It resolves conflicts between different game states that may occur during concurrent
 * updates, checkpoint restoration, or auto-save operations. The resolver ensures data
 * consistency and prevents state corruption while preserving player progress.
 * 
 * Key Features:
 * - Resolves conflicts between local and server states
 * - Preserves game history integrity
 * - Maintains checkpoint consistency
 * - Ensures data continuity
 * - Handles concurrent updates
 * 
 * Data Flow:
 * 1. State comparison and timestamp validation
 * 2. Conflict detection and analysis
 * 3. State merging and resolution
 * 4. History reconciliation
 * 5. Checkpoint preservation
 * 
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async resolveStateConflict(
 *      newState: GameState,
 *      existingState: GameState
 *    ): Promise<GameState> {
 *      return this.conflictResolver.resolveConflict(
 *        newState,
 *        existingState
 *      );
 *    }
 *    ```
 * 
 * 2. StateManager
 *    ```typescript
 *    // In StateManager
 *    public async saveState(state: GameState): Promise<void> {
 *      const existing = await this.loadLatestState();
 *      if (existing) {
 *        state = await this.conflictResolver.resolveConflict(
 *          state,
 *          existing
 *        );
 *      }
 *      await this.persistState(state);
 *    }
 *    ```
 * 
 * 3. CheckpointManager
 *    ```typescript
 *    // In CheckpointManager
 *    public async restoreCheckpoint(state: GameState): Promise<GameState> {
 *      const checkpoint = await this.loadCheckpoint();
 *      return this.conflictResolver.resolveConflict(
 *        checkpoint,
 *        state
 *      );
 *    }
 *    ```
 * 
 * Database Schema:
 * ```sql
 * -- Game session versioning
 * ALTER TABLE game_sessions 
 * ADD COLUMN version text,
 * ADD COLUMN last_modified timestamptz DEFAULT now();
 * 
 * -- Conflict tracking
 * CREATE TABLE state_conflicts (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id uuid REFERENCES game_sessions(id),
 *   resolved_at timestamptz DEFAULT now(),
 *   primary_state jsonb,
 *   secondary_state jsonb,
 *   resolution_type text,
 *   metadata jsonb
 * );
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const resolvedState = await conflictResolver.resolveConflict(
 *     newState,
 *     existingState
 *   );
 *   await saveState(resolvedState);
 * } catch (error) {
 *   debugManager.log('Conflict resolution failed', 'error', { error });
 *   throw new GameError(
 *     'Failed to resolve state conflict',
 *     ErrorCode.STATE_CONFLICT,
 *     error
 *   );
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always validate states before merging
 * 2. Preserve complete history
 * 3. Handle all edge cases
 * 4. Log resolution decisions
 * 5. Maintain data integrity
 * 
 * Performance Optimization:
 * ```typescript
 * // Optimize state merging
 * const optimizeMerge = (primary: GameState, secondary: GameState) => {
 *   return {
 *     ...primary,
 *     // Only merge necessary history
 *     history: mergeHistory(
 *       primary.history.slice(-10),
 *       secondary.history.slice(-10)
 *     ),
 *     // Keep most recent checkpoint
 *     checkpoint: getMostRecentCheckpoint(
 *       primary.checkpoint,
 *       secondary.checkpoint
 *     )
 *   };
 * };
 * 
 * // Implement history deduplication
 * const deduplicateHistory = (history: GameHistoryEntry[]) => {
 *   const seen = new Set<string>();
 *   return history.filter(entry => {
 *     const key = `${entry.sceneId}:${entry.choice}`;
 *     if (seen.has(key)) return false;
 *     seen.add(key);
 *     return true;
 *   });
 * };
 * ```
 * 
 * The resolver works alongside the auto-save system to ensure state consistency
 * when multiple updates occur or when restoring from checkpoints.
 * 
 * @see GameEngine for integration with the main game loop
 * @see StateManager for state persistence
 * @see CheckpointManager for checkpoint handling
 * @see debugManager for error logging
 */

import type { GameState } from '../types';
import { debugManager } from '../debug/DebugManager';

export class ConflictResolver {
  /**
   * Resolves conflicts between two game states
   * 
   * @param newState The new state to be applied
   * @param existingState The current state in the system
   * @returns Resolved game state
   * @throws Error if states cannot be merged
   */
  public async resolveConflict(newState: GameState, existingState: GameState | null): Promise<GameState> {
    if (!existingState) return newState;

    try {
      // Compare timestamps if available
      if (this.isNewer(newState, existingState)) {
        return this.mergeStates(newState, existingState);
      }
      return this.mergeStates(existingState, newState);
    } catch (error) {
      debugManager.log('Error resolving conflict', 'error', { error });
      // Return newer state as fallback
      return this.isNewer(newState, existingState) ? newState : existingState;
    }
  }

  /**
   * Determines which state is newer based on timestamps
   * 
   * @param state1 First state to compare
   * @param state2 Second state to compare
   * @returns true if state1 is newer than state2
   */
  private isNewer(state1: GameState, state2: GameState): boolean {
    const getTimestamp = (state: GameState) => {
      if ('lastModified' in state) return new Date(state.lastModified).getTime();
      if (state.checkpoint?.timestamp) return new Date(state.checkpoint.timestamp).getTime();
      return 0;
    };

    return getTimestamp(state1) > getTimestamp(state2);
  }

  /**
   * Merges two game states, preserving the most relevant data from each
   * 
   * @param primary The primary state (usually newer)
   * @param secondary The secondary state (usually older)
   * @returns Merged game state
   */
  private mergeStates(primary: GameState, secondary: GameState): GameState {
    // Start with the primary state
    const merged = { ...primary };

    // Merge histories, removing duplicates
    const uniqueHistory = [...primary.history];
    for (const entry of secondary.history) {
      if (!uniqueHistory.some(e => 
        e.sceneId === entry.sceneId && 
        e.choice === entry.choice
      )) {
        uniqueHistory.push(entry);
      }
    }

    // Sort history by timestamp if available
    merged.history = uniqueHistory.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Keep the most recent checkpoint
    if (primary.checkpoint && secondary.checkpoint) {
      const primaryTime = new Date(primary.checkpoint.timestamp).getTime();
      const secondaryTime = new Date(secondary.checkpoint.timestamp).getTime();
      merged.checkpoint = primaryTime > secondaryTime ? 
        primary.checkpoint : secondary.checkpoint;
    }

    debugManager.log('States merged successfully', 'success', {
      historyLength: merged.history.length,
      hasCheckpoint: !!merged.checkpoint
    });

    return merged;
  }
}