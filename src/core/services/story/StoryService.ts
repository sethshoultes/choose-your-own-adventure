/**
 * StoryService Class
 * 
 * This service manages story generation, scene progression, and choice handling in AdventureBuildr.
 * It integrates with OpenAI for dynamic content generation and manages the flow of the game narrative.
 * The service works alongside the auto-save system to ensure story progression is reliably persisted.
 * 
 * Key Features:
 * - Dynamic scene generation
 * - Choice validation and processing
 * - Story context management
 * - Scene history tracking
 * - Automatic state persistence
 * 
 * @see GameEngine for integration with the main game loop
 * @see OpenAIService for content generation
 * @see GameState for state structure
 */

import { ServiceRegistry } from '../ServiceRegistry';
import { ValidationService } from '../ValidationService';
import { DatabaseService } from '../DatabaseService';
import { ErrorService, ErrorCode, GameError } from '../ErrorService';
import { OpenAIService } from '../openai/OpenAIService';
import { debugManager } from '../../debug/DebugManager';
import type { Scene, Choice, Character, GameHistoryEntry } from '../../types';

interface StoryContext {
  genre: string;
  character: Character;
  currentScene: Scene;
  history: GameHistoryEntry[];
}

interface StoryCallbacks {
  onToken: (token: string) => void;
  onComplete: (choices: Choice[]) => void;
  onError: (error: Error) => void;
}

export class StoryService {
  /** Required services */
  private validator: ValidationService;
  private database: DatabaseService;
  private openai: OpenAIService;
  private errorService: ErrorService;
  private initialized: boolean = false;

  constructor() {
    this.errorService = ErrorService.getInstance();
  }

  /**
   * Initializes the story service
   * Must be called before any other operations
   * 
   * @throws Error if initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const registry = ServiceRegistry.getInstance();
    try {
      this.validator = registry.get('validation');
      this.database = registry.get('database');
      this.openai = registry.get('openai');
      this.initialized = true;
      debugManager.log('Story service initialized', 'success');
    } catch (error) {
      debugManager.log('Failed to initialize story service', 'error', { error });
      throw error;
    }
  }

  /**
   * Generates a new scene based on the current context and player choice
   * Integrates with OpenAI for content generation
   * 
   * @param context Current story context
   * @param choice Player's selected choice
   * @param callbacks Callbacks for streaming and updates
   * @throws Error if scene generation fails
   */
  public async generateScene(
    context: StoryContext,
    choice: string,
    callbacks: StoryCallbacks
  ): Promise<void> {
    try {
      // Validate context
      const validation = this.validator.validate('storyContext', context);
      if (!validation.valid) {
        throw new GameError(
          'Invalid story context',
          ErrorCode.VALIDATION,
          validation.errors
        );
      }

      // Track scene generation start
      await this.trackSceneGeneration(context.character.id!, {
        genre: context.genre,
        choiceText: choice
      });

      // Generate scene using OpenAI
      await this.openai.generateNextScene({
        context: {
          genre: context.genre,
          character: context.character,
          currentScene: context.currentScene.description,
          history: context.history.slice(-5) // Only use recent history
        },
        choice,
      }, {
        onToken: (token) => {
          callbacks.onToken(token);
          debugManager.log('Scene token received', 'info', { 
            tokenLength: token.length 
          });
        },
        onComplete: async (choices) => {
          // Validate choices
          const choiceValidation = this.validateChoices(choices);
          if (!choiceValidation.valid) {
            throw new GameError(
              'Invalid choices generated',
              ErrorCode.VALIDATION,
              choiceValidation.errors
            );
          }

          // Track scene completion
          await this.trackSceneCompletion(context.character.id!, {
            choices: choices.length,
            historyLength: context.history.length
          });

          callbacks.onComplete(choices);
        },
        onError: (error) => {
          this.errorService.handleError(error);
          callbacks.onError(error);
        }
      });
    } catch (error) {
      this.errorService.handleError(error);
      callbacks.onError(error instanceof Error ? error : new Error('Failed to generate scene'));
    }
  }

  /**
   * Validates generated choices
   * Ensures choices are meaningful and distinct
   * 
   * @param choices Array of choices to validate
   * @returns Validation result with errors if any
   */
  private validateChoices(choices: Choice[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Must have exactly 3 choices
    if (choices.length !== 3) {
      errors.push(`Expected 3 choices, got ${choices.length}`);
    }

    // Each choice must be valid
    choices.forEach((choice, index) => {
      if (!choice.id || typeof choice.id !== 'number') {
        errors.push(`Choice ${index} has invalid ID`);
      }
      if (!choice.text || choice.text.trim().length === 0) {
        errors.push(`Choice ${index} has empty text`);
      }
      if (choice.text.toLowerCase().includes('investigate further')) {
        errors.push(`Choice ${index} contains generic text`);
      }
    });

    // Choices must be unique
    const uniqueTexts = new Set(choices.map(c => c.text.toLowerCase()));
    if (uniqueTexts.size !== choices.length) {
      errors.push('Choices must be unique');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Tracks scene generation in the database
   * Used for analytics and debugging
   * 
   * @param characterId Character generating the scene
   * @param metadata Additional tracking data
   */
  private async trackSceneGeneration(
    characterId: string,
    metadata: any
  ): Promise<void> {
    await this.database.operation(
      `sceneGeneration:${characterId}`,
      async () => {
        const { error } = await supabase.rpc('track_scene_generation', {
          p_character_id: characterId,
          p_metadata: metadata
        });
        if (error) throw error;
      }
    );
  }

  /**
   * Tracks scene completion in the database
   * Used for analytics and progression
   * 
   * @param characterId Character completing the scene
   * @param metadata Completion metrics
   */
  private async trackSceneCompletion(
    characterId: string,
    metadata: any
  ): Promise<void> {
    await this.database.operation(
      `sceneCompletion:${characterId}`,
      async () => {
        const { error } = await supabase.rpc('track_scene_completion', {
          p_character_id: characterId,
          p_metadata: metadata
        });
        if (error) throw error;
      }
    );
  }
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async generateNextScene(choice: string): Promise<void> {
 *      await this.storyService.generateScene(
 *        this.getStoryContext(),
 *        choice,
 *        {
 *          onToken: this.updateScene,
 *          onComplete: this.finalizeScene,
 *          onError: this.handleError
 *        }
 *      );
 *    }
 *    ```
 * 
 * 2. OpenAI Integration
 *    ```typescript
 *    // In OpenAIService
 *    public async generateNextScene(prompt: StoryPrompt): Promise<void> {
 *      const response = await this.makeRequest(prompt);
 *      return this.parseResponse(response);
 *    }
 *    ```
 * 
 * 3. Database Schema
 *    ```sql
 *    -- Scene generation tracking
 *    CREATE TABLE scene_generation_logs (
 *      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *      character_id uuid NOT NULL,
 *      genre text NOT NULL,
 *      choice_text text NOT NULL,
 *      created_at timestamptz DEFAULT now(),
 *      metadata jsonb
 *    );
 * 
 *    -- Scene completion tracking
 *    CREATE TABLE scene_completion_logs (
 *      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *      character_id uuid NOT NULL,
 *      choices_count integer NOT NULL,
 *      history_length integer NOT NULL,
 *      created_at timestamptz DEFAULT now(),
 *      metadata jsonb
 *    );
 *    ```
 * 
 * 4. Error Handling
 *    ```typescript
 *    try {
 *      await this.storyService.generateScene(context, choice, callbacks);
 *    } catch (error) {
 *      this.errorService.handleError(error);
 *      this.recoverFromError(error);
 *    }
 *    ```
 * 
 * Best Practices:
 * 1. Always validate context before generation
 * 2. Use proper error handling
 * 3. Track scene metrics
 * 4. Maintain story consistency
 * 5. Validate generated content
 * 
 * @see ValidationService for context validation
 * @see ErrorService for error handling
 * @see DatabaseService for persistence
 */