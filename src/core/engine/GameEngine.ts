import type { Genre, GameState, Scene, Character } from '../types';
import { getInitialScene, getInitialChoices } from './sceneManager';
import { supabase } from '../../lib/supabase';
import { ResponseParserService } from '../services/ResponseParserService';
import { ProgressionService } from '../services/progression/ProgressionService';
import { debugManager } from '../debug/DebugManager';

export class GameEngine {
  /** Current game state */
  private state: GameState;
  /** Current character */
  private character: Character | null = null;
  /** Service for parsing OpenAI responses */
  private responseParser: ResponseParserService;
  /** Service for handling progression */
  private progressionService: ProgressionService;
  /** Engine initialization status */
  private initialized: boolean = false;
  /** Temporary storage for choices during generation */
  private tempChoices: Choice[] | null = null;

  constructor() {
    this.responseParser = new ResponseParserService();
    this.progressionService = new ProgressionService();
    // Initialize with empty state
    this.state = {
      currentScene: {
        id: 'start',
        description: '',
        choices: []
      },
      history: [],
      gameOver: false,
    };
  }

  /**
   * GameEngine Class
   *
   * This class serves as the core game engine for AdventureBuildr, managing game state,
   * story progression, character interactions, and content generation. It coordinates
   * between various services to provide a seamless gaming experience while ensuring
   * data consistency and state persistence.
   * 
   * Key Features:
   * - Game state management
   * - Story generation and progression
   * - Character state tracking
   * - Automatic state persistence
   * - Checkpoint system
   * - Achievement integration
   * - Error handling and recovery
   * 
   * Data Flow:
   * 1. Game initialization and state loading
   * 2. Player choice processing
   * 3. Story generation via OpenAI
   * 4. State updates and persistence
   * 5. Achievement and progression tracking
   * 
   * Integration Points:
   * 
   * 1. OpenAI Service
   *    ```typescript
   *    private async generateScene(): Promise<Scene> {
   *      return new Promise((resolve, reject) => {
   *        this.openai.generateNextScene(
   *          this.buildPrompt(),
   *          {
   *            onToken: this.handleToken,
   *            onComplete: (choices) => {
   *              resolve(this.buildScene(choices));
   *            },
   *            onError: reject
   *          }
   *        );
   *      });
   *    }
   *    ```
   * 
   * 2. State Management
   *    ```typescript
   *    private async saveGameState(): Promise<void> {
   *      if (!this.character?.id || !this.state.sessionId) return;
   *      
   *      await supabase
   *        .from('game_sessions')
   *        .upsert({
   *          id: this.state.sessionId,
   *          character_id: this.character.id,
   *          current_scene: this.state.currentScene,
   *          game_state: this.state,
   *          status: 'active'
   *        });
   *    }
   *    ```
   * 
   * 3. Achievement System
   *    ```typescript
   *    private async checkAchievements(): Promise<void> {
   *      await this.achievementService.checkAchievements(
   *        this.character,
   *        {
   *          choicesMade: this.state.history.length,
   *          onAchievementUnlocked: this.handleAchievement
   *        }
   *      );
   *    }
   *    ```
   * 
   * 4. Progression System
   *    ```typescript
   *    private async handleProgression(choice: string): Promise<void> {
   *      await this.progressionService.handleChoice({
   *        character: this.character,
   *        choice,
   *        history: this.state.history,
   *        callbacks: {
   *          onXP: this.handleXP,
   *          onLevelUp: this.handleLevelUp
   *        }
   *      });
   *    }
   *    ```
   * 
   * Database Schema:
   * ```sql
   * -- Game sessions table
   * CREATE TABLE game_sessions (
   *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   *   character_id uuid REFERENCES characters(id),
   *   current_scene jsonb NOT NULL,
   *   game_state jsonb NOT NULL,
   *   status session_status NOT NULL DEFAULT 'active',
   *   checkpoint jsonb,
   *   created_at timestamptz DEFAULT now(),
   *   updated_at timestamptz DEFAULT now()
   * );
   * 
   * -- Game history tracking
   * CREATE TABLE game_history (
   *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   *   session_id uuid REFERENCES game_sessions(id),
   *   scene_description text NOT NULL,
   *   player_choice text NOT NULL,
   *   created_at timestamptz DEFAULT now()
   * );
   * ```
   * 
   * Error Handling:
   * ```typescript
   * try {
   *   await this.handleChoice(choiceId);
   * } catch (error) {
   *   debugManager.log('Error handling choice', 'error', { error });
   *   
   *   if (error instanceof StreamError) {
   *     await this.handleStreamError(error);
   *   } else if (error instanceof StateError) {
   *     await this.recoverState();
   *   } else {
   *     throw new GameError(
   *       'Failed to process choice',
   *       ErrorCode.GAME_ENGINE,
   *       error
   *     );
   *   }
   * }
   * ```
   * 
   * Best Practices:
   * 1. Always validate state changes
   * 2. Implement proper error recovery
   * 3. Maintain state consistency
   * 4. Log important events
   * 5. Handle edge cases
   * 
   * Performance Optimization:
   * ```typescript
   * // Optimize state updates
   * private async updateState(
   *   newState: Partial<GameState>
   * ): Promise<void> {
   *   // Batch multiple state updates
   *   if (this.pendingUpdates) {
   *     this.pendingUpdates = {
   *       ...this.pendingUpdates,
   *       ...newState
   *     };
   *     return;
   *   }
   *   
   *   this.pendingUpdates = newState;
   *   await this.flushUpdates();
   * }
   * 
   * // Implement state caching
   * private readonly stateCache = new Map<string, GameState>();
   * 
   * private async getCachedState(
   *   sessionId: string
   * ): Promise<GameState | null> {
   *   if (this.stateCache.has(sessionId)) {
   *     return this.stateCache.get(sessionId)!;
   *   }
   *   
   *   const state = await this.loadState(sessionId);
   *   if (state) {
   *     this.stateCache.set(sessionId, state);
   *   }
   *   return state;
   * }
   * ```
   * 
   * The engine works alongside the auto-save system to ensure state consistency
   * when multiple updates occur or when restoring from checkpoints.
   * 
   * @see OpenAIService for content generation
   * @see StateManager for state persistence
   * @see ProgressionService for character advancement
   * @see AchievementService for achievement tracking
   * @see debugManager for error logging
   */

  /**
   * Initializes the game engine
   * Must be called before any other operations
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.progressionService.initialize();
    this.initialized = true;
    debugManager.log('Game engine initialized', 'success');
  }

  /**
   * Initializes a new game session or loads an existing one
   * 
   * @param genre Game genre
   * @param character Player character
   * @throws Error if initialization fails
   */
  public async initializeGame(genre: Genre, character: Character): Promise<void> {
    this.character = character;
    
    debugManager.log('Initializing game', 'info', { 
      characterId: character.id,
      genre: character.genre 
    });

    // Get active session specifically for this character
    const { data: sessions, error: loadError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('character_id', character.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (loadError) {
      debugManager.log('Error loading sessions', 'error', { error: loadError });
      throw loadError;
    }

    // If there's an existing session for this character, load it
    const existingSession = sessions?.[0];
    if (existingSession && existingSession.game_state) {
      debugManager.log('Loading existing session', 'success', { 
        characterId: character.id,
        sessionId: existingSession.id 
      });

      // Ensure game_state has all required fields
      const gameState = {
        sessionId: existingSession.id,
        currentScene: existingSession.current_scene,
        history: existingSession.game_state.history || [],
        gameOver: false,
        checkpoint: existingSession.checkpoint || null
      };

      this.state = {
        ...gameState
      };

      debugManager.log('Existing session loaded', 'success', {
        sessionId: existingSession.id,
        sceneId: existingSession.current_scene.id,
        historyLength: existingSession.game_state.history?.length || 0
      });

      return;
    }

    debugManager.log('No existing session found, creating new game', 'info');

    const sceneDescription = getInitialScene(character.genre);
    const sceneChoices = getInitialChoices(character.genre);
    
    const initialScene = {
      id: 'scene-1',
      description: sceneDescription,
      choices: sceneChoices
    };

    const initialState = {
      currentScene: initialScene,
      history: [],
      gameOver: false
    };
    // Create new session specifically for this character
    const { data: sessionData, error: sessionError } = await supabase.rpc('safe_handle_game_session', {
      p_character_id: character.id,
      p_current_scene: initialScene,
      p_game_state: initialState,
      p_metadata: {
        genre: character.genre,
        initialized_at: new Date().toISOString(),
        character_id: character.id,
        character_name: character.name
      }
    });

    if (sessionError) {
      debugManager.log('Failed to initialize game session', 'error', { 
        error: sessionError,
        characterId: character.id 
      });
      throw new Error('Failed to initialize game session');
    }

    debugManager.log('Game session initialized', 'success', { 
      sessionId: sessionData.session_id,
      characterId: character.id,
      characterName: character.name
    });

    this.state = {
      sessionId: sessionData.session_id,
      ...initialState
    };

    debugManager.log('Game state initialized', 'success', { 
      sessionId: sessionData.session_id,
      scene: this.state.currentScene.id,
      characterId: character.id,
      characterName: character.name
    });
  }

  /**
   * Returns the current game state
   */
  public getCurrentState(): GameState {
    return this.state;
  }

  /**
   * Returns the current character
   */
  public getCharacter(): Character | null {
    return this.character;
  }
  
  /**
   * Creates a manual checkpoint of the current game state
   * This is in addition to the automatic state persistence
   * 
   * @throws Error if no current scene or character
   */
  public createCheckpoint(): void {
    if (!this.state.currentScene || !this.character?.id) {
      debugManager.log('Cannot create checkpoint: No current scene', 'error');
      throw new Error('Cannot create checkpoint: No current scene');
    }

    // Get current session ID
    const sessionId = this.state.sessionId;
    if (!sessionId) {
      debugManager.log('No active session found', 'error');
      throw new Error('No active session found');
    }

    // Save checkpoint to database
    return supabase.rpc('save_checkpoint', {
      p_session_id: sessionId,
      p_scene: this.state.currentScene,
      p_history: this.state.history,
      p_metadata: {
        character_id: this.character.id,
        timestamp: new Date().toISOString()
      }
    }).then(({ data, error }) => {
      if (error) {
        debugManager.log('Failed to save checkpoint', 'error', { error });
        return;
      }

      // Update local state with checkpoint info
      this.state = {
        ...this.state,
        checkpoint: data
      };

      debugManager.log('Checkpoint saved', 'success', {
        checkpointId: data.checkpoint_id,
        sessionId: data.session_id,
        timestamp: data.timestamp
      });
    });
  }

  /**
   * Restores the game state to a previously created checkpoint
   * 
   * @throws Error if no checkpoint exists
   */
  public async restoreCheckpoint(): Promise<void> {
    if (!this.state.checkpoint) {
      debugManager.log('Cannot restore: No checkpoint exists', 'error');
      throw new Error('No checkpoint exists');
    }

    try {
      const { data: checkpoints, error: checkpointError } = await supabase
        .from('checkpoint_history')
        .select('*')
        .eq('session_id', this.state.sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkpointError) throw checkpointError;
      if (!checkpoints?.length) throw new Error('No checkpoint found');

      const checkpoint = checkpoints[0];

      // Update local state with checkpoint data
      this.state = {
        sessionId: this.state.sessionId,
        currentScene: checkpoint.scene as Scene,
        history: checkpoint.history as GameHistoryEntry[],
        gameOver: false,
        checkpoint: {
          scene: checkpoint.scene as Scene,
          history: checkpoint.history as GameHistoryEntry[],
          timestamp: checkpoint.created_at
        }
      };

      debugManager.log('Checkpoint restored', 'success', {
        sessionId: this.state.sessionId,
        timestamp: checkpoint.created_at
      });
    } catch (error) {
      debugManager.log('Failed to restore checkpoint', 'error', { error });
      throw error;
    }
  }

  /**
   * Updates the current character
   * Used when character attributes change
   * 
   * @param character Updated character data
   */
  public updateCharacter(character: Character): void {
    this.character = character;
  }

  /**
   * Generates a new scene from the OpenAI response
   * 
   * @param buffer Raw response buffer
   * @returns Parsed scene object
   * @throws Error if parsing fails
   */
  private async generateScene(buffer: string): Promise<Scene> {
    try {
      const parsedScene = this.responseParser.parseResponse(buffer);
      debugManager.log('Scene generated successfully', 'success', { 
        description: parsedScene.description.substring(0, 50) + '...',
        choicesCount: parsedScene.choices.length 
      });
      return parsedScene;
    } catch (error) {
      debugManager.log('Scene generation failed', 'error', { error });
      throw error;
    }
  }

  /**
   * Handles a player's choice and progresses the game
   * Automatically saves state after processing
   * 
   * @param choiceId Selected choice ID
   * @param callbacks Callbacks for streaming and updates
   * @throws Error if choice handling fails
   */
  public async handleChoice(
    choiceId: number, 
    callbacks: {
      onLoading?: (loading: boolean) => void;
      onToken: (token: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
      onXP?: (amount: number, source: string) => void;
      onLevelUp?: (result: LevelUpResult) => void;
      onAchievementUnlocked?: (achievement: Achievement) => void;
      onXP?: (amount: number, source: string) => void;
      onLevelUp?: (result: LevelUpResult) => void;
      onAchievementUnlocked?: (achievement: Achievement) => void;
    }
  ): Promise<void> { 
    if (!this.character) throw new Error('No character selected');
    if (!this.state.currentScene) throw new Error('No current scene');
    
    debugManager.log('Handling choice', 'info', { 
      choiceId,
      characterId: this.character.id,
      sessionId: this.state.sessionId
    });
    
    const currentChoice = this.state.currentScene.choices.find(c => c.id === choiceId);
    if (!currentChoice) throw new Error(`Invalid choice ID: ${choiceId}`);

    callbacks.onLoading?.(true);
    
    // Add choice to history before making request
    this.state.history.push({
      sceneId: this.state.currentScene.id,
      choice: currentChoice.text,
      sceneDescription: this.state.currentScene.description,
      timestamp: new Date().toISOString()
    });

    try {
      // Get OpenAI key
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { data: credentials } = await supabase
        .from('api_credentials')
        .select('openai_key')
        .eq('user_id', user.id)
        .single();

      if (!credentials?.openai_key) {
        throw new Error('OpenAI API key not found');
      }

      // Make OpenAI request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.openai_key}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a creative storyteller for ${this.character.genre} adventures. 
Your responses must be in this exact JSON format:
{
  "description": "Scene description here...",
  "choices": [
    "First choice here",
    "Second choice here",
    "Third choice here"
  ]
}

Guidelines:
1. Always provide exactly 3 choices
2. Make each choice distinct and meaningful
3. Avoid generic choices like "investigate further"
4. Keep the story engaging and coherent
5. Consider the character's attributes and equipment`
            },
            {
              role: 'user',
              content: `Current scene: ${this.state.currentScene.description}\nPlayer chose: ${currentChoice.text}\nGenerate the next scene and choices.`
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate scene');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let parsedScene = null;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.includes('[DONE]')) continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(line.replace('data: ', ''));
            if (json.choices?.[0]?.delta?.content) {
              const token = json.choices[0].delta.content;
              buffer += token;
              callbacks.onToken(token);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }

      // Auto-save state after scene update
      if (this.character.id && this.state.sessionId) {
        try {
          const { error: saveError } = await supabase
            .from('game_sessions')
            .upsert({
              id: this.state.sessionId,
              character_id: this.character.id,
              current_scene: this.state.currentScene,
              game_state: this.state,
              status: 'active',
              updated_at: new Date().toISOString()
            });

          if (saveError) {
            debugManager.log('Error auto-saving state', 'error', { error: saveError });
          } else {
            debugManager.log('Game state auto-saved', 'success', {
              sessionId: this.state.sessionId,
              sceneId: this.state.currentScene.id
            });
          }
        } catch (saveError) {
          debugManager.log('Error auto-saving state', 'error', { error: saveError });
        }
      }

      // Update scene with generated content
      try {
        parsedScene = await this.generateScene(buffer);
        // Keep scene ID consistent with history length
        parsedScene.id = `scene-${this.state.history.length + 1}`;
        // Use parsed choices if available, otherwise fallback to temp choices
        if (parsedScene.choices.length === 0 && this.tempChoices) {
          parsedScene.choices = this.tempChoices;
        }
        this.state.currentScene = parsedScene;
        debugManager.log('Scene parsed successfully', 'success', { 
          sceneId: parsedScene.id,
          choicesCount: parsedScene.choices.length 
        });
      } catch (error) {
        debugManager.log('Failed to parse scene', 'error', { error });
        this.state.currentScene = {
          id: `scene-${this.state.history.length + 1}`,
          description: buffer,
          choices: this.tempChoices || []
        };
      }

      // Auto-save state after scene update
      if (this.character.id && this.state.sessionId) {
        try {
          const { error: saveError } = await supabase
            .from('game_sessions')
            .upsert({
              id: this.state.sessionId,
              character_id: this.character.id,
              current_scene: this.state.currentScene,
              game_state: this.state,
              status: 'active',
              updated_at: new Date().toISOString()
            });

          if (saveError) {
            debugManager.log('Error auto-saving state', 'error', { error: saveError });
          } else {
            debugManager.log('Game state auto-saved', 'success', {
              sessionId: this.state.sessionId,
              sceneId: this.state.currentScene.id
            });
          }
        } catch (saveError) {
          debugManager.log('Error auto-saving state', 'error', { error: saveError });
        }
      }
      this.tempChoices = null;
      callbacks.onComplete();
      callbacks.onLoading?.(false);
      
      // Handle progression after successful choice
      try {
        await this.progressionService.handleChoiceMade({
          character: this.character,
          choice: currentChoice.text,
          history: this.state.history,
          callbacks: {
            onXP: callbacks.onXP,
            onLevelUp: callbacks.onLevelUp,
            onAchievementUnlocked: callbacks.onAchievementUnlocked
          }
        });
      } catch (error) {
        debugManager.log('Error handling progression', 'error', { error });
        // Continue game even if progression fails
      }
    } catch (error) {
      if (this.tempChoices) {
        this.state.currentScene.choices = this.tempChoices;
        this.tempChoices = null;
      }
      callbacks.onLoading?.(false);
      callbacks.onError(error instanceof Error ? error : new Error('Failed to handle choice'));
    }
  }

  /**
   * Loads a previously saved game state
   * Currently always starts new games
   * 
   * @param characterId Character ID to load state for
   * @returns true if state was loaded, false if new game started
   */
  public async loadSavedState(characterId: string): Promise<boolean> {
    // For now, just return false to always start a new game
    return false;
  }
}