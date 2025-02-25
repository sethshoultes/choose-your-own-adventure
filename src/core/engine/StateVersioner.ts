/**
 * StateVersioner Class
 * 
 * This class manages game state versioning and migration in the AdventureBuildr game engine.
 * It ensures that game states remain compatible across different versions of the application
 * by providing version tracking and automatic state migration. The versioner works alongside
 * the auto-save system to ensure state compatibility when loading saves from different game
 * versions.
 * 
 * Key Features:
 * - State version tracking
 * - Automatic state migration
 * - Version comparison
 * - Migration path management
 * - State transformation
 * 
 * Data Flow:
 * 1. State version detection
 * 2. Migration path determination
 * 3. Sequential migration execution
 * 4. State transformation
 * 5. Version update
 * 
 * @see GameEngine for game state integration
 * @see StateManager for state persistence
 * @see GameState for state structure
 */

import type { GameState } from '../types';
import { debugManager } from '../debug/DebugManager';

/**
 * Extends GameState to include version information
 */
interface VersionedState extends GameState {
  /** Version string in format 'vX.Y' */
  version: string;
  /** ISO timestamp of last modification */
  lastModified: string;
}

export class StateVersioner {
  /** Current version of the state format */
  private readonly CURRENT_VERSION = 'v1.0';

  /** 
   * Migration functions for each version
   * Maps version strings to migration functions
   */
  private migrations: Record<string, (state: GameState) => GameState> = {
    'v0.9': this.migrateFromV09,
    'v0.8': this.migrateFromV08
  };

  /**
   * Adds version information to a game state
   * 
   * @param state Game state to version
   * @returns State with version information
   * 
   * @example
   * ```typescript
   * const versionedState = versioner.versionState(currentState);
   * ```
   */
  public versionState(state: GameState): VersionedState {
    return {
      ...state,
      version: this.CURRENT_VERSION,
      lastModified: new Date().toISOString()
    };
  }

  /**
   * Migrates a state to the current version if needed
   * Applies migrations in sequence until reaching current version
   * 
   * @param state State to migrate
   * @returns Migrated state in current version format
   * @throws Error if migration fails
   * 
   * @example
   * ```typescript
   * const migratedState = await versioner.migrateState(oldState);
   * ```
   */
  public migrateState(state: VersionedState): GameState {
    const version = state.version || 'v0.8'; // Default for unversioned states
    
    if (version === this.CURRENT_VERSION) {
      return state;
    }

    try {
      let currentState = { ...state };
      const versions = Object.keys(this.migrations)
        .sort((a, b) => this.compareVersions(a, b));

      // Apply migrations in order until we reach current version
      for (const v of versions) {
        if (this.compareVersions(version, v) < 0) {
          currentState = this.migrations[v](currentState);
          debugManager.log('State migrated', 'info', { 
            fromVersion: version,
            toVersion: v 
          });
        }
      }

      return currentState;
    } catch (error) {
      debugManager.log('State migration failed', 'error', { error, state });
      throw error;
    }
  }

  /**
   * Compares two version strings
   * Returns negative if v1 < v2, positive if v1 > v2, 0 if equal
   * 
   * @param v1 First version string (format: 'vX.Y')
   * @param v2 Second version string (format: 'vX.Y')
   * @returns Comparison result (-1, 0, or 1)
   * 
   * @example
   * ```typescript
   * const result = versioner.compareVersions('v1.0', 'v0.9'); // Returns 1
   * ```
   */
  private compareVersions(v1: string, v2: string): number {
    const [major1, minor1] = v1.substring(1).split('.').map(Number);
    const [major2, minor2] = v2.substring(1).split('.').map(Number);
    
    if (major1 !== major2) return major1 - major2;
    return minor1 - minor2;
  }

  /**
   * Migrates state from v0.9 to v1.0
   * Changes:
   * - Converts choice IDs from strings to numbers
   * - Ensures consistent choice format
   * 
   * @param state State to migrate
   * @returns Migrated state
   */
  private migrateFromV09(state: GameState): GameState {
    // Convert choice IDs from strings to numbers
    return {
      ...state,
      currentScene: {
        ...state.currentScene,
        choices: state.currentScene.choices.map(choice => ({
          ...choice,
          id: typeof choice.id === 'string' ? parseInt(choice.id) : choice.id
        }))
      }
    };
  }

  /**
   * Migrates state from v0.8 to v0.9
   * Changes:
   * - Adds timestamps to history entries
   * - Ensures history entries have consistent format
   * 
   * @param state State to migrate
   * @returns Migrated state
   */
  private migrateFromV08(state: GameState): GameState {
    // Add timestamps to history entries that don't have them
    return {
      ...state,
      history: state.history.map(entry => ({
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString()
      }))
    };
  }
}

/**
 * Integration Points:
 * 
 * 1. StateManager
 *    ```typescript
 *    // In StateManager
 *    public async saveState(state: GameState): Promise<void> {
 *      const versionedState = this.versioner.versionState(state);
 *      await this.persistState(versionedState);
 *    }
 *    
 *    public async loadState(id: string): Promise<GameState> {
 *      const state = await this.loadFromDb(id);
 *      return this.versioner.migrateState(state);
 *    }
 *    ```
 * 
 * 2. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async loadSavedState(): Promise<void> {
 *      const state = await this.stateManager.loadState();
 *      if (state) {
 *        const migratedState = this.versioner.migrateState(state);
 *        this.setState(migratedState);
 *      }
 *    }
 *    ```
 * 
 * 3. CheckpointManager
 *    ```typescript
 *    // In CheckpointManager
 *    public async restoreCheckpoint(state: GameState): Promise<GameState> {
 *      const checkpoint = await this.loadCheckpoint();
 *      return this.versioner.migrateState(checkpoint);
 *    }
 *    ```
 * 
 * Database Schema:
 * ```sql
 * -- Game state versioning
 * ALTER TABLE game_sessions 
 * ADD COLUMN version text,
 * ADD COLUMN last_modified timestamptz DEFAULT now();
 * 
 * -- Version history tracking
 * CREATE TABLE state_versions (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id uuid REFERENCES game_sessions(id),
 *   version text NOT NULL,
 *   migrated_at timestamptz DEFAULT now(),
 *   old_state jsonb,
 *   new_state jsonb,
 *   metadata jsonb
 * );
 * ```
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   const migratedState = versioner.migrateState(state);
 *   await saveState(migratedState);
 * } catch (error) {
 *   debugManager.log('Migration failed', 'error', { error });
 *   throw new GameError(
 *     'Failed to migrate game state',
 *     ErrorCode.STATE_MIGRATION,
 *     error
 *   );
 * }
 * ```
 * 
 * Best Practices:
 * 1. Always migrate states on load
 * 2. Version all saved states
 * 3. Test migrations thoroughly
 * 4. Log migration failures
 * 5. Handle edge cases
 * 
 * Performance Optimization:
 * ```typescript
 * // Cache version comparisons
 * private readonly versionCache = new Map<string, number>();
 * 
 * private compareVersionsCached(v1: string, v2: string): number {
 *   const key = `${v1}:${v2}`;
 *   if (!this.versionCache.has(key)) {
 *     this.versionCache.set(key, this.compareVersions(v1, v2));
 *   }
 *   return this.versionCache.get(key)!;
 * }
 * 
 * // Batch migrations
 * public async migrateStates(states: GameState[]): Promise<GameState[]> {
 *   const results = await Promise.all(
 *     states.map(state => {
 *       try {
 *         return this.migrateState(state);
 *       } catch (error) {
 *         debugManager.log('Migration failed', 'error', { error });
 *         return state;
 *       }
 *     })
 *   );
 *   return results;
 * }
 * ```
 * 
 * The versioner works alongside the auto-save system to ensure state compatibility
 * when loading saves from different game versions.
 * 
 * @see GameEngine for game state integration
 * @see StateManager for state persistence
 * @see GameState for state structure
 */