import { create } from 'zustand';
import type { Genre, GameState, Scene } from '../types';
import { supabase } from '../lib/supabase';

interface GameStore {
  genre: Genre | null;
  gameState: GameState;
  isLoading: boolean;
  setGenre: (genre: Genre) => void;
  setGameState: (state: GameState) => void;
  handleChoice: (choiceId: number) => Promise<void>;
  saveGameState: () => Promise<void>;
  loadGameState: (sessionId: string) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  genre: null,
  gameState: {
    currentScene: {
      id: 'start',
      description: 'Welcome to your adventure. Choose a genre to begin.',
      choices: [],
    },
    history: [],
    gameOver: false,
  },
  isLoading: false,

  setGenre: (genre) => set({ genre }),
  
  setGameState: (gameState) => set({ gameState }),
  
  handleChoice: async (choiceId) => {
    set({ isLoading: true });
    
    try {
      const { genre, gameState } = get();
      const { currentScene, history } = gameState;
      
      // Save the current choice to history
      const updatedHistory = [...history, {
        sceneId: currentScene.id,
        choice: currentScene.choices.find(c => c.id === choiceId)?.text || '',
      }];
      
      // Get the next scene from OpenAI
      // Implementation in next steps
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error handling choice:', error);
      set({ isLoading: false });
    }
  },
  
  saveGameState: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { genre, gameState } = get();
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        genre,
        current_scene: gameState.currentScene,
        game_state: gameState,
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  loadGameState: async (sessionId) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (error) throw error;
    
    set({
      genre: data.genre,
      gameState: data.game_state,
    });
  },
}));