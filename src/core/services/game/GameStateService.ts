import { supabase } from '../../../lib/supabase';
import type { GameState, Character } from '../../types';

export class GameStateService {
  async saveGameState(character: Character, gameState: GameState): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('game_sessions')
        .upsert({
          character_id: character.id,
          current_scene: gameState.currentScene,
          game_state: gameState,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving game state:', error);
      throw error;
    }
  }

  async loadGameState(characterId: string): Promise<GameState | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_state')
        .eq('character_id', characterId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data?.game_state || null;
    } catch (error) {
      console.error('Error loading game state:', error);
      return null; // Return null instead of throwing to handle gracefully
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
    } catch (error) {
      console.error('Error saving game history:', error);
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
      console.error('Error loading game history:', error);
      throw error;
    }
  }
}