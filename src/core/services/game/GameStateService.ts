import { supabase } from '../../../lib/supabase';
import type { GameState, Character } from '../../types';
import { debugManager } from '../../debug/DebugManager';

export class GameStateService {
  async saveGameState(character: Character, gameState: GameState): Promise<void> {
    try {
      if (!character.id) {
        throw new Error('Character ID is required');
      }

      // Use the safe upsert function
      const { data, error } = await supabase
        .rpc('safe_upsert_game_session', {
          p_character_id: character.id,
          p_current_scene: gameState.currentScene,
          p_game_state: gameState
        });

      if (error) throw error;
      debugManager.log('Game state saved', 'success', { 
        characterId: character.id,
        sessionId: data
      });
    } catch (error) {
      debugManager.log('Error saving game state', 'error', { error });
      throw error;
    }
  }

  async loadGameState(characterId: string): Promise<GameState | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_state')
        .eq('character_id', characterId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        debugManager.log('Error loading game state', 'error', { error });
        throw error;
      }

      if (data?.game_state) {
        debugManager.log('Game state loaded', 'success', { characterId });
        return data.game_state as GameState;
      }

      return null;
    } catch (error) {
      debugManager.log('Error loading game state', 'error', { error });
      return null;
    }
  }

  async saveGameHistory(
    sessionId: string,
    sceneDescription: string,
    playerChoice: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_history')
        .insert({
          session_id: sessionId,
          scene_description: sceneDescription,
          player_choice: playerChoice,
        });

      if (error) throw error;
      this.debug.log('Game history saved', 'success', { sessionId });
    } catch (error) {
      this.debug.log('Error saving game history', 'error', { error });
      throw error;
    }
  }

  async getGameHistory(sessionId: string): Promise<Array<{
    scene_description: string;
    player_choice: string;
    created_at: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('scene_description, player_choice, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.debug.log('Error loading game history', 'error', { error });
      throw error;
    }
  }
}