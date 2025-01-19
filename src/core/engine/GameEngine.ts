import type { Genre, GameState, Scene, Character } from '../types';
import { getInitialScene, getInitialChoices } from './sceneManager';
import { OpenAIService } from '../services/openai';
import { supabase } from '../../lib/supabase';
import { debugManager } from '../debug/DebugManager';
import { GameStateService } from '../services/game/GameStateService';

export class GameEngine {
  private state: GameState;
  private character: Character | null = null;
  private openai: OpenAIService;
  private gameStateService: GameStateService;
  private streamBuffer: string = '';

  constructor() {
    this.openai = new OpenAIService();
    this.gameStateService = new GameStateService();
    const initialScene = {
      id: 'start',
      description: 'Welcome to your adventure. Choose a genre to begin.',
      choices: [],
    };
    
    // Initialize with a proper empty state
    this.state = {
      currentScene: initialScene,
      history: [],
      gameOver: false,
    };
    
    debugManager.log('Game engine initialized', 'info', { initialState: this.state });
  }

  public initializeGame(genre: Genre, character: Character): void {
    this.character = character;
    
    const sceneDescription = getInitialScene(genre);
    const sceneChoices = getInitialChoices(genre);
    
    debugManager.log('Initializing game', 'info', {
      genre,
      character,
      initialScene: sceneDescription,
      choices: sceneChoices
    });

    this.state = {
      currentScene: {
        id: 'scene-1',
        description: sceneDescription,
        choices: sceneChoices,
      },
      history: [],
      gameOver: false,
    };
    
    // Save initial state
    if (character.id) {
      this.gameStateService.saveGameState(character, this.state)
        .catch((error) => {
          debugManager.log('Failed to save initial state', 'error', { error });
          console.error('Failed to save initial state:', error);
        });
    }

    debugManager.log('Game initialized', 'success', { 
      scene: this.state.currentScene,
      state: this.state
    });
  }

  public getCurrentState(): GameState {
    return this.state;
  }

  public getCharacter(): Character | null {
    return this.character;
    debugManager.log('Game initialized', 'info', { genre, character });
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
    if (!this.state.currentScene) throw new Error('No current scene');
    let responseBuffer = '';

    const currentChoice = this.state.currentScene.choices.find(c => c.id === choiceId);
    if (!currentChoice) {
      const error = new Error(`Invalid choice ID: ${choiceId}`);
      callbacks.onError(error);
      return;
    }

    const historyEntry = {
      sceneId: this.state.currentScene.id,
      choice: currentChoice.text,
      sceneDescription: this.state.currentScene.description,
      timestamp: new Date().toISOString(),
    };

    this.state.history.push(historyEntry);

    try {
      // Save the current state before generating the next scene
      await this.gameStateService.saveGameState(this.character, this.state);
      
      await this.openai.generateNextScene({
        context: {
          genre: this.character.genre,
          character: this.character,
          currentScene: this.state.currentScene.description,
          history: this.state.history,
        },
        choice: currentChoice.text,
      }, {
        onToken: (token) => {
          responseBuffer += token;
          callbacks.onToken(token);
        },
        onComplete: async (choices) => {
          // Update the current scene with the generated text
          this.state.currentScene = {
            id: `scene-${this.state.history.length + 1}`,
            description: responseBuffer,
            choices: choices
          };

          // Save the updated state after scene generation
          await this.gameStateService.saveGameState(this.character, this.state);
          responseBuffer = '';
          callbacks.onComplete();
        },
        onError: (error) => {
          console.error('Error generating scene:', error);
          responseBuffer = '';
          callbacks.onError(new Error('Failed to generate the next scene. Please try again.'));
        },
      });
    } catch (error) {
      console.error('Error in handleChoice:', error);
      responseBuffer = '';
      callbacks.onError(new Error('Failed to process your choice. Please try again.'));
    }
  }

  public createCheckpoint(): void {
    if (!this.state.currentScene) {
      debugManager.log('Cannot create checkpoint: No current scene', 'error');
      return;
    }

    this.state.checkpoint = {
      scene: { ...this.state.currentScene },
      history: [...this.state.history],
      timestamp: new Date().toISOString()
    };

    debugManager.log('Checkpoint created', 'success', {
      scene: this.state.currentScene.id,
      historyLength: this.state.history.length
    });

    // Save state with checkpoint
    if (this.character?.id) {
      this.gameStateService.saveGameState(this.character, this.state)
        .catch(error => {
          debugManager.log('Failed to save checkpoint', 'error', { error });
        });
    }
  }

  public restoreCheckpoint(): void {
    if (!this.state.checkpoint) {
      debugManager.log('Cannot restore: No checkpoint exists', 'error');
      return;
    }

    this.state.currentScene = { ...this.state.checkpoint.scene };
    this.state.history = [...this.state.checkpoint.history];

    debugManager.log('Checkpoint restored', 'success', {
      scene: this.state.currentScene.id,
      historyLength: this.state.history.length
    });

    // Save restored state
    if (this.character?.id) {
      this.gameStateService.saveGameState(this.character, this.state)
        .catch(error => {
          debugManager.log('Failed to save restored state', 'error', { error });
        });
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