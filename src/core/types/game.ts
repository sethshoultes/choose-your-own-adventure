/**
 * Game Types Module
 * 
 * This module defines the core game types and interfaces for the AdventureBuildr game engine.
 * It provides type definitions for scenes, choices, game state, and history tracking,
 * ensuring type safety and consistent data structures throughout the application.
 * 
 * Key Features:
 * - Scene structure definition
 * - Choice system types
 * - Game state management
 * - History tracking
 * - Checkpoint system
 * 
 * Data Flow:
 * 1. Scene generation and updates
 * 2. Choice selection and processing
 * 3. State management and persistence
 * 4. History tracking and updates
 * 5. Checkpoint creation and restoration
 * 
 * @module types/game
 */

import type { Genre } from './genre';

/**
 * Scene interface defining a game scene structure
 * Contains description and available choices
 * 
 * @property id - Unique scene identifier
 * @property description - Scene narrative text
 * @property choices - Available player choices
 */
export interface Scene {
  /** Unique scene identifier */
  id: string;
  /** Scene narrative text */
  description: string;
  /** Available player choices */
  choices: Choice[];
}

/**
 * Choice interface for player decisions
 * Represents a single choice option in a scene
 * 
 * @property id - Unique choice identifier
 * @property text - Choice description text
 */
export interface Choice {
  /** Unique choice identifier */
  id: number;
  /** Choice description text */
  text: string;
}

/**
 * Game state interface tracking current game progress
 * Manages active scene, history, and checkpoint data
 * 
 * @property currentScene - Active game scene
 * @property history - Array of past choices and scenes
 * @property gameOver - Game completion status
 * @property sessionId - Optional session identifier
 * @property checkpoint - Optional saved game state
 */
export interface GameState {
  /** Active game scene */
  currentScene: Scene;
  /** Array of past choices and scenes */
  history: GameHistoryEntry[];
  /** Game completion status */
  gameOver: boolean;
  /** Optional session identifier */
  sessionId?: string;
  /** Optional saved game state */
  checkpoint?: {
    /** Saved scene state */
    scene: Scene;
    /** Saved history state */
    history: GameHistoryEntry[];
    /** Checkpoint timestamp */
    timestamp: string;
  };
  /** Optional checkpoint metadata */
  checkpoint?: {
    /** Checkpoint identifier */
    checkpoint_id: string;
    /** Session identifier */
    session_id: string;
    /** Creation timestamp */
    timestamp: string;
  };
}

/**
 * Game history entry interface
 * Tracks individual player choices and scene progression
 * 
 * @property sceneId - Scene identifier
 * @property choice - Selected choice text
 * @property sceneDescription - Optional scene description
 * @property timestamp - Optional entry timestamp
 */
export interface GameHistoryEntry {
  /** Scene identifier */
  sceneId: string;
  /** Selected choice text */
  choice: string;
  /** Optional scene description */
  sceneDescription?: string;
  /** Optional entry timestamp */
  timestamp?: string;
}

/**
 * Integration Points:
 * 
 * 1. GameEngine
 *    ```typescript
 *    // In GameEngine
 *    export class GameEngine {
 *      private state: GameState;
 *      
 *      public async handleChoice(choiceId: number): Promise<void> {
 *        const choice = this.state.currentScene.choices
 *          .find(c => c.id === choiceId);
 *          
 *        this.state.history.push({
 *          sceneId: this.state.currentScene.id,
 *          choice: choice.text,
 *          timestamp: new Date().toISOString()
 *        });
 *        
 *        await this.generateNextScene();
 *      }
 *    }
 *    ```
 * 
 * 2. Scene Components
 *    ```typescript
 *    // In StoryScene component
 *    interface Props {
 *      scene: Scene;
 *      onChoice: (choiceId: number) => void;
 *      history: GameHistoryEntry[];
 *    }
 *    
 *    function StoryScene({ scene, onChoice, history }: Props) {
 *      return (
 *        <div>
 *          <p>{scene.description}</p>
 *          {scene.choices.map(choice => (
 *            <button
 *              key={choice.id}
 *              onClick={() => onChoice(choice.id)}
 *            >
 *              {choice.text}
 *            </button>
 *          ))}
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 3. State Management
 *    ```typescript
 *    // In StateManager
 *    export class StateManager {
 *      public async saveState(state: GameState): Promise<void> {
 *        await supabase
 *          .from('game_sessions')
 *          .upsert({
 *            id: state.sessionId,
 *            current_scene: state.currentScene,
 *            game_state: state,
 *            updated_at: new Date().toISOString()
 *          });
 *      }
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
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now(),
 *   status session_status NOT NULL DEFAULT 'active',
 *   checkpoint jsonb
 * );
 * 
 * -- Game history table
 * CREATE TABLE game_history (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id uuid REFERENCES game_sessions(id),
 *   scene_id text NOT NULL,
 *   choice_text text NOT NULL,
 *   scene_description text,
 *   created_at timestamptz DEFAULT now()
 * );
 * ```
 * 
 * Usage Examples:
 * ```typescript
 * // Create new game state
 * const initialState: GameState = {
 *   currentScene: {
 *     id: 'scene-1',
 *     description: 'You stand at a crossroads...',
 *     choices: [
 *       { id: 1, text: 'Go left' },
 *       { id: 2, text: 'Go right' },
 *       { id: 3, text: 'Stay here' }
 *     ]
 *   },
 *   history: [],
 *   gameOver: false
 * };
 * 
 * // Add history entry
 * const addToHistory = (
 *   state: GameState,
 *   choice: Choice
 * ): GameState => ({
 *   ...state,
 *   history: [
 *     ...state.history,
 *     {
 *       sceneId: state.currentScene.id,
 *       choice: choice.text,
 *       sceneDescription: state.currentScene.description,
 *       timestamp: new Date().toISOString()
 *     }
 *   ]
 * });
 * 
 * // Create checkpoint
 * const createCheckpoint = (state: GameState): GameState => ({
 *   ...state,
 *   checkpoint: {
 *     scene: { ...state.currentScene },
 *     history: [...state.history],
 *     timestamp: new Date().toISOString()
 *   }
 * });
 * ```
 * 
 * Type Validation:
 * ```typescript
 * // Validate scene structure
 * const isValidScene = (scene: Scene): boolean => {
 *   if (!scene.id || !scene.description) return false;
 *   if (!Array.isArray(scene.choices)) return false;
 *   return scene.choices.every(choice => 
 *     typeof choice.id === 'number' &&
 *     typeof choice.text === 'string'
 *   );
 * };
 * 
 * // Validate game state
 * const isValidGameState = (state: GameState): boolean => {
 *   if (!isValidScene(state.currentScene)) return false;
 *   if (!Array.isArray(state.history)) return false;
 *   if (typeof state.gameOver !== 'boolean') return false;
 *   
 *   if (state.checkpoint) {
 *     if (!isValidScene(state.checkpoint.scene)) return false;
 *     if (!Array.isArray(state.checkpoint.history)) return false;
 *   }
 *   
 *   return true;
 * };
 * ```
 * 
 * Best Practices:
 * 1. Always validate state changes
 * 2. Use proper type annotations
 * 3. Include timestamps for tracking
 * 4. Maintain history integrity
 * 5. Handle checkpoints properly
 * 
 * @see Genre for available genres
 * @see GameEngine for game logic
 * @see StateManager for state handling
 */