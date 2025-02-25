/**
 * GameStateService Class
 * 
 * This service handles all game state persistence operations in AdventureBuildr.
 * It provides a reliable interface for saving and loading game states, managing
 * checkpoints, and handling state recovery. The service works in conjunction with
 * the automatic state persistence system to ensure game progress is never lost.
 * 
 * Key Features:
 * - Automatic state persistence after each choice
 * - Manual checkpoint creation and restoration
 * - State recovery and validation
 * - Session management
 * - History tracking
 * 
 * @see GameEngine for integration with the main game loop
 * @see StateManager for state management
 * @see CheckpointManager for checkpoint handling
 */

import { supabase } from '../../../lib/supabase';
import type { GameState } from '../../types';
import { debugManager } from '../../debug/DebugManager';

export class GameStateService {
  /**
   * Saves the current game state to the database
   * Automatically called after each choice and scene update
   * 
   * @param character Current character
   * @param gameState Game state to save
   * @throws Error if save fails
   */
  public async saveGameState(character: Character, gameState: GameState): Promise<void> {
    try {
      if (!character.id) {
        throw new Error('Character ID is required for saving game state');
      }

      // Use a transaction to ensure data consistency
      const { data, error } = await supabase.rpc('safe_handle_game_session', {
        p_character_id: character.id,
        p_current_scene: gameState.currentScene,
        p_game_state: gameState,
        p_metadata: {
          version: 'v1.0',
          lastModified: new Date().toISOString()
        }
      });

      if (error) throw error;

      // Track history entry if available
      if (gameState.history.length > 0) {
        const latestEntry = gameState.history[gameState.history.length - 1];
        // Ensure we have all required fields
        if (latestEntry.sceneDescription?.trim() && latestEntry.choice?.trim()) {
          const { error: historyError } = await supabase.rpc('track_game_history', {
            p_session_id: data.session_id,
            p_character_id: character.id,
            p_scene_description: latestEntry.sceneDescription.trim(),
            p_player_choice: latestEntry.choice.trim(),
          });

          if (historyError) {
            debugManager.log('Error tracking game history', 'error', { 
              error: historyError,
              sessionId: data.session_id,
              characterId: character.id
            });
            throw historyError;
          }
          
          debugManager.log('Game history tracked', 'success', {
            sessionId: data.session_id,
            characterId: character.id,
            sceneDescription: latestEntry.sceneDescription.substring(0, 50) + '...',
            choice: latestEntry.choice
          });
        }
      }

      debugManager.log('Game state saved', 'success', { 
        characterId: character.id,
        sceneId: gameState.currentScene.id,
        sessionId: data.session_id
      });
    } catch (error) {
      debugManager.log('Error saving game state', 'error', { error });
      throw error;
    }
  }

  /**
   * Loads a saved game state from the database
   * Used when resuming a game or loading a checkpoint
   * 
   * @param characterId Character ID to load state for
   * @returns Loaded game state or null if not found
   * @throws Error if load fails
   */
  public async loadGameState(characterId: string): Promise<GameState | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          id,
          character_id,
          current_scene,
          game_state,
          status,
          metadata,
          checkpoint
        `)
        .eq('character_id', characterId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        debugManager.log('Error loading game state', 'error', { error });
        throw error;
      }

      if (data?.game_state) {
        const gameState = data.game_state as GameState;
        debugManager.log('Found active session', 'info', {
          sessionId: data.id,
          characterId,
          hasCheckpoint: !!data.checkpoint
        });

        // Load history for this session
        const { data: history, error: historyError } = await supabase
          .from('game_history')
          .select('*')
          .eq('session_id', data.id)
          .eq('character_id', characterId)
          .order('created_at', { ascending: true });

        if (historyError) {
          debugManager.log('Error loading game history', 'error', { error: historyError });
        } else if (history?.length) {
          debugManager.log('Loaded game history', 'success', {
            sessionId: data.id,
            characterId,
            historyCount: history.length
          });

          // Update game state with loaded history
          gameState.history = history.map(entry => ({
            sceneId: `scene-${entry.id}`,
            choice: entry.player_choice,
            sceneDescription: entry.scene_description,
            timestamp: entry.created_at
          }));

          // Ensure current scene matches last history entry
          if (history.length > 0) {
            const lastEntry = history[history.length - 1];
            if (lastEntry.scene_description !== gameState.currentScene.description) {
              debugManager.log('Syncing current scene with history', 'info');
              gameState.currentScene.description = lastEntry.scene_description;
            }
          }
        }

        debugManager.log('Game state loaded', 'success', { 
          characterId,
          sessionId: data.id,
          historyCount: history?.length || 0
        });

        return gameState;
      }

      debugManager.log('No active session found', 'info', { characterId });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugManager.log('Error loading game state', 'error', { 
        error: errorMessage,
        characterId 
      });
      return null;
    }
  }

  /**
   * Loads a checkpoint from the database
   * Used for manual save point restoration
   * 
   * @param characterId Character ID to load checkpoint for
   * @returns Checkpoint state or null if not found
   * @throws Error if load fails
   */
  public async loadCheckpoint(characterId: string): Promise<GameState | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('checkpoint')
        .eq('character_id', characterId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.checkpoint) {
        return {
          currentScene: data.checkpoint.scene,
          history: data.checkpoint.history,
          gameOver: false
        };
      }

      return null;
    } catch (error) {
      debugManager.log('Error loading checkpoint', 'error', { error });
      return null;
    }
  }

  /**
   * Reconstructs a game state from history entries
   * Used as a fallback when other recovery methods fail
   * 
   * @param characterId Character ID to reconstruct state for
   * @returns Reconstructed state or null if not possible
   * @throws Error if reconstruction fails
   */
  public async reconstructFromHistory(characterId: string): Promise<GameState | null> {
    try {
      const { data: history, error } = await supabase
        .from('game_history')
        .select('scene_description, player_choice, created_at')
        .eq('session_id', characterId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!history?.length) return null;

      // Reconstruct state from history
      const reconstructedState: GameState = {
        currentScene: {
          id: `scene-${history.length}`,
          description: history[history.length - 1].scene_description,
          choices: [] // Will need to regenerate choices
        },
        history: history.map((entry, index) => ({
          sceneId: `scene-${index + 1}`,
          choice: entry.player_choice,
          sceneDescription: entry.scene_description,
          timestamp: entry.created_at
        })),
        gameOver: false
      };

      return reconstructedState;
    } catch (error) {
      debugManager.log('Error reconstructing from history', 'error', { error });
      return null;
    }
  }
}