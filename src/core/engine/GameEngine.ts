import type { Genre, GameState, Scene, Character } from '../types';
import { getInitialScene, getInitialChoices } from './sceneManager';
import { OpenAIService } from '../services/openai';
import { supabase } from '../../lib/supabase';
import { GameStateService } from '../services/game/GameStateService';

export class GameEngine {
  private state: GameState;
  private character: Character | null = null;
  private openai: OpenAIService;
  private gameStateService: GameStateService;

  constructor() {
    this.openai = new OpenAIService();
    this.gameStateService = new GameStateService();
    this.state = {
      currentScene: {
        id: 'start',
        description: 'Welcome to your adventure. Choose a genre to begin.',
        choices: [],
      },
      history: [],
      gameOver: false,
    };
  }

  public initializeGame(genre: Genre, character: Character): void {
    this.character = character;
    this.state = {
      currentScene: {
        id: 'scene-1',
        description: getInitialScene(genre),
        choices: getInitialChoices(genre),
      },
      history: [],
      gameOver: false,
    };
  }

  public getCurrentState(): GameState {
    return this.state;
  }

  public getCharacter(): Character | null {
    return this.character;
  }

  public async handleChoice(
    choiceId: number,
    callbacks: {
      onToken: (token: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    if (!this.character) throw new Error('No character selected');

    const currentChoice = this.state.currentScene.choices.find(c => c.id === choiceId);
    if (!currentChoice) throw new Error('Invalid choice');

    const historyEntry = {
      sceneId: this.state.currentScene.id,
      choice: currentChoice.text,
      timestamp: new Date().toISOString(),
    };

    this.state.history.push(historyEntry);

    try {
      // Save the current state before generating the next scene
      await this.gameStateService.saveGameState(this.character, this.state);
      
      // Generate the next scene
      await this.openai.generateNextScene({
        context: {
          genre: this.character.genre,
          character: this.character,
          currentScene: this.state.currentScene.description,
          history: this.state.history,
        },
        choice: currentChoice.text,
      }, {
        onToken: callbacks.onToken,
        onComplete: async () => {
          // Save the updated state after scene generation
          await this.gameStateService.saveGameState(this.character, this.state);
          callbacks.onComplete();
        },
        onError: callbacks.onError,
      });
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  public async loadSavedState(characterId: string): Promise<boolean> {
    try {
      const savedState = await this.gameStateService.loadGameState(characterId);
      const { data: characterData } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (!characterData) {
        throw new Error('Character not found');
      }

      this.character = characterData;

      if (savedState && savedState.currentScene) {
        this.state = savedState;
        return true;
      }
      
      // Initialize new game state if no saved state exists
      this.initializeGame(characterData.genre, characterData);
      return false;
    } catch (error) {
      console.error('Error loading saved state:', error);
      return false;
    }
  }
}