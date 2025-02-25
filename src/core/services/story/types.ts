/**
 * Story Service Types
 * 
 * This module defines the core types used by the story generation and management system
 * in AdventureBuildr. It provides type definitions for story context, scene generation,
 * and callback handling.
 * 
 * These types are used throughout the story system to ensure type safety and maintain
 * consistent data structures for story generation and progression.
 * 
 * @module story/types
 */

import type { Scene, Choice, Character, GameHistoryEntry } from '../../types';

/**
 * Story context for scene generation
 * Contains all necessary information for generating the next scene
 * 
 * @property genre - Game genre for context-appropriate content
 * @property character - Current player character
 * @property currentScene - Current game scene
 * @property history - Recent game history for context
 */
export interface StoryContext {
  /** Game genre for appropriate content generation */
  genre: string;
  /** Current player character */
  character: Character;
  /** Current game scene */
  currentScene: Scene;
  /** Recent game history for context */
  history: GameHistoryEntry[];
}

/**
 * Callbacks for story generation process
 * Handles streaming tokens, completion, and errors
 * 
 * Used by the StoryService to provide real-time updates during
 * scene generation and handle completion or errors.
 * 
 * @property onToken - Called for each token during streaming
 * @property onComplete - Called when scene generation is complete
 * @property onError - Called if an error occurs
 */
export interface StoryCallbacks {
  /** Called for each token during streaming */
  onToken: (token: string) => void;
  /** Called when scene generation is complete */
  onComplete: (choices: Choice[]) => void;
  /** Called if an error occurs */
  onError: (error: Error) => void;
}

/**
 * Scene generation metadata
 * Tracks timing and metrics for scene generation
 * 
 * @property genre - Game genre
 * @property choiceText - Selected choice text
 * @property timestamp - Generation timestamp
 * @property context - Additional context
 */
export interface SceneGenerationMetadata {
  /** Game genre */
  genre: string;
  /** Selected choice text */
  choiceText: string;
  /** Generation timestamp */
  timestamp: string;
  /** Additional context data */
  context?: any;
}

/**
 * Scene completion metadata
 * Tracks metrics for completed scene generation
 * 
 * @property choices - Number of choices generated
 * @property historyLength - Current history length
 * @property timestamp - Completion timestamp
 * @property metrics - Performance metrics
 */
export interface SceneCompletionMetadata {
  /** Number of choices generated */
  choices: number;
  /** Current history length */
  historyLength: number;
  /** Completion timestamp */
  timestamp: string;
  /** Optional performance metrics */
  metrics?: {
    /** Time taken to generate scene */
    generationTime: number;
    /** Number of tokens generated */
    tokenCount: number;
  };
}

/**
 * Integration Points:
 * 
 * 1. StoryService
 *    ```typescript
 *    // In StoryService
 *    public async generateScene(
 *      context: StoryContext,
 *      choice: string,
 *      callbacks: StoryCallbacks
 *    ): Promise<void> {
 *      // Generate scene using context
 *      // Call callbacks during generation
 *    }
 *    ```
 * 
 * 2. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    private async generateNextScene(choice: string): Promise<void> {
 *      const context: StoryContext = {
 *        genre: this.character.genre,
 *        character: this.character,
 *        currentScene: this.state.currentScene,
 *        history: this.state.history
 *      };
 *      
 *      await this.storyService.generateScene(context, choice, {
 *        onToken: this.updateScene,
 *        onComplete: this.finalizeScene,
 *        onError: this.handleError
 *      });
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
 * 4. UI Components
 *    ```typescript
 *    // In StoryScene component
 *    const handleChoice = async (choiceId: number) => {
 *      await gameEngine.handleChoice(choiceId, {
 *        onToken: (token) => {
 *          setCurrentScene(prev => ({
 *            ...prev,
 *            description: prev.description + token
 *          }));
 *        },
 *        onComplete: (choices) => {
 *          setCurrentScene(prev => ({
 *            ...prev,
 *            choices
 *          }));
 *        },
 *        onError: (error) => {
 *          setError(error.message);
 *        }
 *      });
 *    };
 *    ```
 * 
 * Best Practices:
 * 1. Always validate story context before generation
 * 2. Handle streaming tokens efficiently
 * 3. Provide meaningful error messages
 * 4. Track generation metrics
 * 5. Maintain consistent scene structure
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await storyService.generateScene(context, choice, callbacks);
 * } catch (error) {
 *   debugManager.log('Error generating scene', 'error', { error });
 *   throw new GameError(
 *     'Failed to generate scene',
 *     ErrorCode.SCENE_GENERATION,
 *     error
 *   );
 * }
 * ```
 * 
 * @see StoryService for implementation details
 * @see GameEngine for integration with game logic
 * @see Scene for scene structure
 */